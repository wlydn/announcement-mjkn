import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// Utility function for retry logic with exponential backoff
const retryAxiosRequest = async (requestFn, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Only retry on timeout or network errors
            if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || 
                error.message.includes('timeout') || error.message.includes('network')) {
                const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`Request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error; // Don't retry on non-network errors
            }
        }
    }
};

function App() {
    // State untuk data aplikasi
    const [announcements, setAnnouncements] = useState([]);
    const [currentPrayerTimes, setCurrentPrayerTimes] = useState({
        fajr: '05:30',
        dhuhr: '12:00',
        asr: '15:30',
        maghrib: '18:00',
        isha: '19:30'
    });
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
    const [countdownSeconds, setCountdownSeconds] = useState(0);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Refs untuk elemen DOM
    const audioRef = useRef(null);
    const countdownTimerRef = useRef(null); // Untuk menyimpan ID interval countdown

    // Helper Functions (dipindahkan ke dalam komponen atau di luar jika stateless)
    const getPrayerName = (prayer) => {
        const names = {
            fajr: 'Subuh',
            dhuhr: 'Dzuhur',
            asr: 'Ashar',
            maghrib: 'Maghrib',
            isha: 'Isya'
        };
        return names[prayer] || prayer;
    };

    const formatTime = (date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const showStatus = useCallback((message, type) => {
        setStatus({ message, type });
        setTimeout(() => {
            setStatus({ message: '', type: '' });
        }, 5000);
    }, []);

    const isPrayerTime = useCallback(() => {
        const now = new Date();
        const nowTime = now.getTime();
        
        for (const [prayer, time] of Object.entries(currentPrayerTimes)) {
            const [prayerHour, prayerMinute] = time.split(':').map(Number);
            const prayerTimeObj = new Date();
            prayerTimeObj.setHours(prayerHour, prayerMinute, 0, 0);
            
            const prayerStart = prayerTimeObj.getTime();
            const prayerEnd = prayerStart + (30 * 60 * 1000); // 30 menit duration untuk sholat
            
            if (nowTime >= prayerStart && nowTime <= prayerEnd) {
                return true;
            }
        }
        return false;
    }, [currentPrayerTimes]);

    // Fungsi baru untuk mengecek apakah sudah 5 menit setelah waktu sholat
    const canPlayAfterPrayer = useCallback(() => {
        const now = new Date();
        const nowTime = now.getTime();
        
        for (const [prayer, time] of Object.entries(currentPrayerTimes)) {
            const [prayerHour, prayerMinute] = time.split(':').map(Number);
            const prayerTimeObj = new Date();
            prayerTimeObj.setHours(prayerHour, prayerMinute, 0, 0);
            
            const prayerStart = prayerTimeObj.getTime();
            const prayerEnd = prayerStart + (5 * 60 * 1000); // 5 menit untuk sholat
            const playAllowedTime = prayerEnd + (3 * 60 * 1000); // 3 menit setelah sholat selesai
            
            // Jika sekarang adalah 5 menit setelah sholat selesai
            if (nowTime >= playAllowedTime && nowTime <= (playAllowedTime + (2 * 60 * 1000))) { // Window 2 menit untuk trigger
                return { canPlay: true, prayerName: getPrayerName(prayer) };
            }
        }
        return { canPlay: false, prayerName: null };
    }, [currentPrayerTimes]);

    const getCurrentPrayerName = useCallback(() => {
        const now = new Date();
        const nowTime = now.getTime();
        for (const [prayer, time] of Object.entries(currentPrayerTimes)) {
            const [prayerHour, prayerMinute] = time.split(':').map(Number);
            const prayerTimeObj = new Date();
            prayerTimeObj.setHours(prayerHour, prayerMinute, 0, 0);
            const prayerStart = prayerTimeObj.getTime();
            const prayerEnd = prayerStart + (60 * 60 * 1000);
            if (nowTime >= prayerStart && nowTime <= prayerEnd) {
                return getPrayerName(prayer);
            }
        }
        return "Shalat";
    }, [currentPrayerTimes]);

    // Fungsi untuk update tanggal dan waktu
    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            setCurrentDate(now.toLocaleDateString('id-ID', options));
            setCurrentTime(now.toLocaleTimeString('id-ID'));
        };
        updateDateTime();
        const intervalId = setInterval(updateDateTime, 1000);
        return () => clearInterval(intervalId);
    }, []);

    // Fetch Prayer Times
    useEffect(() => {
        const fetchPrayerTimesByLocation = async () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const { latitude, longitude } = position.coords;
                            const response = await axios.get(
                                `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`,
                                {
                                    timeout: 30000, // Increased to 30 seconds timeout
                                    headers: {
                                        'Accept': 'application/json',
                                    }
                                }
                            );
                            
                            if (response.data && response.data.data && response.data.data.timings) {
                                const timings = response.data.data.timings;
                                const newTimes = {
                                    fajr: timings.Fajr.slice(0, 5),
                                    dhuhr: timings.Dhuhr.slice(0, 5),
                                    asr: timings.Asr.slice(0, 5),
                                    maghrib: timings.Maghrib.slice(0, 5),
                                    isha: timings.Isha.slice(0, 5)
                                };
                                setCurrentPrayerTimes(newTimes);
                                localStorage.setItem('prayerTimes', JSON.stringify(newTimes));
                                localStorage.setItem('prayerTimesLastFetch', Date.now().toString());
                                if(isPrayerTime()) {
                                    showStatus('Saat ini sedang waktu shalat, pengumuman ditunda', 'error');
                                }
                            } else {
                                throw new Error('Invalid API response format');
                            }
                        } catch (error) {
                            console.error('Error fetching prayer times:', error);
                            // Use saved prayer times if available
                            const savedPrayerTimes = localStorage.getItem('prayerTimes');
                            if (savedPrayerTimes) {
                                setCurrentPrayerTimes(JSON.parse(savedPrayerTimes));
                                showStatus('Menggunakan jadwal shalat tersimpan', 'info');
                            } else {
                                showStatus('Gagal mengambil jadwal shalat, menggunakan default', 'error');
                            }
                        }
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        // Use saved prayer times if available
                        const savedPrayerTimes = localStorage.getItem('prayerTimes');
                        if (savedPrayerTimes) {
                            setCurrentPrayerTimes(JSON.parse(savedPrayerTimes));
                            showStatus('Menggunakan jadwal shalat tersimpan', 'info');
                        } else {
                            showStatus('Gagal mendapatkan lokasi, menggunakan jadwal shalat default', 'error');
                        }
                    },
                    {
                        timeout: 10000, // 10 second timeout for geolocation
                        enableHighAccuracy: false,
                        maximumAge: 300000 // 5 minutes cache
                    }
                );
            } else {
                // Use saved prayer times if available
                const savedPrayerTimes = localStorage.getItem('prayerTimes');
                if (savedPrayerTimes) {
                    setCurrentPrayerTimes(JSON.parse(savedPrayerTimes));
                    showStatus('Menggunakan jadwal shalat tersimpan', 'info');
                } else {
                    showStatus('Geolocation tidak didukung, menggunakan jadwal shalat default', 'error');
                }
            }
        };
        
        // Only fetch if we don't have saved prayer times or they're old
        const savedPrayerTimes = localStorage.getItem('prayerTimes');
        const lastFetch = localStorage.getItem('prayerTimesLastFetch');
        const now = Date.now();
        
        if (!savedPrayerTimes || !lastFetch || (now - parseInt(lastFetch)) > 24 * 60 * 60 * 1000) {
            fetchPrayerTimesByLocation();
        } else {
            // Use cached prayer times
            setCurrentPrayerTimes(JSON.parse(savedPrayerTimes));
        }
    }, []); // Remove dependencies to prevent infinite loops

    // Fetch announcements from Vercel Blob storage
    const fetchAnnouncementsFromBlob = useCallback(async () => {
        try {
            console.log('Fetching announcements from Vercel Blob storage...');
            
            const response = await retryAxiosRequest(
                () => axios.get('/api/list', {
                    timeout: 30000, // Increased to 30 seconds timeout
                    headers: {
                        'Accept': 'application/json',
                    }
                }),
                3, // 3 retries
                1000 // 1 second base delay
            );

            if (response.data && response.data.announcements) {
                const blobAnnouncements = response.data.announcements;
                console.log(`Found ${blobAnnouncements.length} announcements in Blob storage`);
                
                setAnnouncements(blobAnnouncements);
                // Also save to localStorage as backup
                localStorage.setItem('announcements', JSON.stringify(blobAnnouncements));
                localStorage.setItem('announcementsLastFetch', Date.now().toString());
                
                if (blobAnnouncements.length > 0) {
                    showStatus(`Berhasil memuat ${blobAnnouncements.length} pengumuman dari storage`, 'success');
                } else {
                    showStatus('Tidak ada pengumuman di storage. Silakan upload file audio.', 'info');
                }
            } else {
                throw new Error('Invalid response format from list API');
            }
        } catch (error) {
            console.error('Error fetching announcements from Blob:', error);
            
            // Enhanced error handling
            let errorMessage = 'Gagal memuat pengumuman dari storage';
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Timeout saat memuat pengumuman. Menggunakan data lokal.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Masalah jaringan. Menggunakan data lokal.';
            }
            
            // Fallback to localStorage if Blob fetch fails
            const savedAnnouncements = localStorage.getItem('announcements');
            if (savedAnnouncements) {
                const localAnnouncements = JSON.parse(savedAnnouncements);
                setAnnouncements(localAnnouncements);
                showStatus(`${errorMessage} - Menggunakan ${localAnnouncements.length} pengumuman tersimpan lokal`, 'info');
            } else {
                showStatus(errorMessage, 'error');
            }
        }
    }, [showStatus]);

    // Initialize data from localStorage and Blob storage on client-side
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Load prayer times from localStorage
            const savedPrayerTimes = localStorage.getItem('prayerTimes');
            if (savedPrayerTimes) {
                setCurrentPrayerTimes(JSON.parse(savedPrayerTimes));
            }

            // Always fetch fresh data from Blob storage on page load/reload
            console.log('Page loaded/reloaded - Fetching fresh data from Vercel Blob storage...');
            
            // Load cached announcements first for immediate display
            const savedAnnouncements = localStorage.getItem('announcements');
            if (savedAnnouncements) {
                const localAnnouncements = JSON.parse(savedAnnouncements);
                setAnnouncements(localAnnouncements);
                console.log(`Loaded ${localAnnouncements.length} cached announcements for immediate display`);
            }
            
            // Then fetch fresh data from Blob storage
            fetchAnnouncementsFromBlob();
        }
    }, [fetchAnnouncementsFromBlob]);

    // Save announcements to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('announcements', JSON.stringify(announcements));
        }
    }, [announcements]);

    // Persistent Countdown Logic
    const startCountdownTimer = useCallback((intervalMinutes) => {
        clearInterval(countdownTimerRef.current);
        
        let remainingSeconds = intervalMinutes * 60;
        const startTime = Date.now();
        const endTime = startTime + (remainingSeconds * 1000);
        
        // Save countdown state to localStorage
        localStorage.setItem('countdownEndTime', endTime.toString());
        localStorage.setItem('countdownInterval', intervalMinutes.toString());
        
        setCountdownSeconds(remainingSeconds);
        
        countdownTimerRef.current = setInterval(() => {
            const now = Date.now();
            const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
            
            setCountdownSeconds(timeLeft);
            
            if (timeLeft <= 0) {
                clearInterval(countdownTimerRef.current);
                localStorage.removeItem('countdownEndTime');
                localStorage.removeItem('countdownInterval');
                
                if (isPrayerTime()) {
                    showStatus('Pemutaran ditunda - Sedang waktu shalat. Mengulang hitungan mundur.', 'error');
                    startCountdownTimer(intervalMinutes); // Ulang hitungan mundur jika waktu shalat
                } else {
                    // Play next announcement
                    const nextIndex = (currentAnnouncementIndex + 1) % announcements.length;
                    if (announcements.length > 0) {
                        playAnnouncement(nextIndex);
                    }
                }
            }
        }, 1000);
    }, [isPrayerTime, showStatus, currentAnnouncementIndex, announcements.length]);

    // Play Announcement
    const playAnnouncement = useCallback((index) => {
        clearInterval(countdownTimerRef.current);
        setCountdownSeconds(0); // Reset countdown display

        if (isPrayerTime()) {
            const now = new Date();
            const currentPrayer = getCurrentPrayerName();
            showStatus(`Skip pengumuman - Sedang waktu ${currentPrayer} hingga ${formatTime(new Date(now.getTime() + (60 * 60 * 1000)))}`, 'error');
            // Start countdown again with fallback value
            const intervalMinutes = parseInt(document.getElementById('playInterval')?.value || '15');
            setTimeout(() => {
                startCountdownTimer(intervalMinutes);
            }, 100);
            return;
        }
        
        if (index >= 0 && index < announcements.length) {
            setCurrentAnnouncementIndex(index);
            const announcement = announcements[index];
            
            if (audioRef.current) {
                audioRef.current.src = announcement.url;
                audioRef.current.load(); // Memuat ulang audio jika src berubah
                
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    showStatus(`Memainkan pengumuman: ${announcement.name}`, 'success');
                    
                    audioRef.current.onended = () => {
                        setIsPlaying(false);
                        const intervalMinutes = parseInt(document.getElementById('playInterval')?.value || '15');
                        startCountdownTimer(intervalMinutes);
                    };
                }).catch(error => {
                    showStatus('Gagal memainkan pengumuman: ' + error.message, 'error');
                    const intervalMinutes = parseInt(document.getElementById('playInterval')?.value || '15');
                    startCountdownTimer(intervalMinutes);
                });
            }
        }
    }, [announcements, isPrayerTime, getCurrentPrayerName, showStatus, startCountdownTimer]);

    // Auto-play announcements 5 minutes after prayer time
    useEffect(() => {
        const checkPrayerTimeAndPlay = () => {
            const afterPrayerCheck = canPlayAfterPrayer();
            
            if (afterPrayerCheck.canPlay && announcements.length > 0 && !isPlaying) {
                // Trigger announcement 5 minutes after prayer ends
                showStatus(`Waktu ${afterPrayerCheck.prayerName} telah selesai. Memulai pengumuman otomatis.`, 'success');
                playAnnouncement(currentAnnouncementIndex);
            }
        };

        // Check every minute for prayer time trigger
        const prayerCheckInterval = setInterval(checkPrayerTimeAndPlay, 60000); // Check every minute
        
        return () => clearInterval(prayerCheckInterval);
    }, [canPlayAfterPrayer, announcements, isPlaying, currentAnnouncementIndex, playAnnouncement, showStatus]);

    // Restore countdown on page load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedEndTime = localStorage.getItem('countdownEndTime');
            const savedInterval = localStorage.getItem('countdownInterval');
            
            if (savedEndTime && savedInterval) {
                const endTime = parseInt(savedEndTime);
                const intervalMinutes = parseInt(savedInterval);
                const now = Date.now();
                const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
                
                if (timeLeft > 0) {
                    // Resume countdown from where it left off
                    setCountdownSeconds(timeLeft);
                    
                    countdownTimerRef.current = setInterval(() => {
                        const currentTime = Date.now();
                        const remainingTime = Math.max(0, Math.floor((endTime - currentTime) / 1000));
                        
                        setCountdownSeconds(remainingTime);
                        
                        if (remainingTime <= 0) {
                            clearInterval(countdownTimerRef.current);
                            localStorage.removeItem('countdownEndTime');
                            localStorage.removeItem('countdownInterval');
                            
                            if (isPrayerTime()) {
                                showStatus('Pemutaran ditunda - Sedang waktu shalat. Mengulang hitungan mundur.', 'error');
                                startCountdownTimer(intervalMinutes);
                            } else {
                                // Play next announcement if available
                                if (announcements.length > 0) {
                                    const nextIndex = (currentAnnouncementIndex + 1) % announcements.length;
                                    playAnnouncement(nextIndex);
                                }
                            }
                        }
                    }, 1000);
                    
                    showStatus(`Melanjutkan hitungan mundur: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`, 'info');
                } else {
                    // Countdown has expired while page was closed
                    localStorage.removeItem('countdownEndTime');
                    localStorage.removeItem('countdownInterval');
                    
                    if (!isPrayerTime() && announcements.length > 0) {
                        // Auto-play if countdown expired during page reload
                        setTimeout(() => {
                            playAnnouncement(currentAnnouncementIndex);
                        }, 1000);
                    }
                }
            }
        }
    }, [isPrayerTime, showStatus, announcements.length, currentAnnouncementIndex, playAnnouncement, startCountdownTimer]);

    // Play Next Announcement
    const playNextAnnouncement = useCallback(() => {
        if (announcements.length === 0) {
            showStatus('Tidak ada pengumuman yang tersedia untuk diputar.', 'error');
            return;
        }
        
        const nextIndex = (currentAnnouncementIndex + 1) % announcements.length;
        playAnnouncement(nextIndex);
    }, [announcements, currentAnnouncementIndex, showStatus, playAnnouncement]);

    // Delete Announcement
    const deleteAnnouncement = useCallback(async (index) => {
        if (index >= 0 && index < announcements.length) {
            const announcementToDelete = announcements[index];
            
            try {
                showStatus('Menghapus pengumuman...', 'info');
                
                // Call Vercel Blob delete API with retry logic
                const response = await retryAxiosRequest(
                    () => axios.delete('/api/delete', {
                        data: {
                            url: announcementToDelete.url,
                            pathname: announcementToDelete.public_id
                        },
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        timeout: 30000, // 30 seconds timeout
                    }),
                    2, // 2 retries for delete operations
                    1500 // 1.5 second base delay
                );

                console.log('Delete response:', response.data);

                // Stop playback if the current announcement is deleted
                if (index === currentAnnouncementIndex && isPlaying) {
                    if (audioRef.current) audioRef.current.pause();
                    setIsPlaying(false);
                    clearInterval(countdownTimerRef.current);
                    setCountdownSeconds(0);
                }
                
                // Remove from local state
                const newAnnouncements = announcements.filter((_, i) => i !== index);
                setAnnouncements(newAnnouncements);
                
                // Update localStorage
                localStorage.setItem('announcements', JSON.stringify(newAnnouncements));
                
                // Adjust current index if needed
                if (currentAnnouncementIndex >= newAnnouncements.length) {
                    setCurrentAnnouncementIndex(0);
                }
                
                showStatus('Pengumuman berhasil dihapus dari Vercel Blob storage', 'success');
                
            } catch (error) {
                console.error('Delete failed:', error);
                
                let errorMessage = 'Gagal menghapus pengumuman';
                
                if (error.response) {
                    const serverError = error.response.data;
                    errorMessage = serverError.message || errorMessage;
                    
                    if (serverError.error === 'Missing BLOB_READ_WRITE_TOKEN environment variable') {
                        errorMessage = 'Konfigurasi Vercel Blob belum diatur. Periksa environment variables.';
                    } else if (error.response.status === 404) {
                        errorMessage = 'File tidak ditemukan di storage. Mungkin sudah dihapus sebelumnya.';
                        // Still remove from local state if file not found in storage
                        const newAnnouncements = announcements.filter((_, i) => i !== index);
                        setAnnouncements(newAnnouncements);
                        localStorage.setItem('announcements', JSON.stringify(newAnnouncements));
                        if (currentAnnouncementIndex >= newAnnouncements.length) {
                            setCurrentAnnouncementIndex(0);
                        }
                    }
                    
                    console.error('Server error details:', serverError);
                } else if (error.request) {
                    errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
                } else if (error.code === 'ECONNABORTED') {
                    errorMessage = 'Timeout saat menghapus file. Mencoba lagi...';
                } else {
                    errorMessage = error.message || errorMessage;
                }
                
                showStatus(errorMessage, 'error');
            }
        }
    }, [announcements, currentAnnouncementIndex, isPlaying, showStatus]);

    // Start Playback
    const startPlayback = useCallback(() => {
        if (announcements.length === 0) {
            showStatus('Tidak ada pengumuman yang tersedia', 'error');
            return;
        }
        
        if (isPlaying) {
            showStatus('Pemutaran sudah berjalan', 'error');
            return;
        }
        
        if (countdownSeconds > 0) {
            showStatus('Hitungan mundur sedang berjalan. Tunggu hingga selesai atau hentikan terlebih dahulu.', 'error');
            return;
        }
        
        playAnnouncement(currentAnnouncementIndex);
        showStatus(`Pemutaran dimulai`, 'success');
    }, [announcements, isPlaying, countdownSeconds, playAnnouncement, currentAnnouncementIndex, showStatus]);

    // Stop Playback
    const stopPlayback = useCallback(() => {
        // Stop current playback if running
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        
        // Stop countdown timer
        clearInterval(countdownTimerRef.current);
        setCountdownSeconds(0);
        
        // Clear countdown persistence data
        localStorage.removeItem('countdownEndTime');
        localStorage.removeItem('countdownInterval');
        localStorage.removeItem('isPlaybackActive');
        
        showStatus('Pemutaran dan hitungan mundur dihentikan', 'success');
    }, [isPlaying, showStatus]);

    // Handle File Upload
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Enhanced file validation
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
        
        if (!file.type.match('audio.*') && !allowedTypes.includes(file.type)) {
            showStatus('File harus berupa audio (MP3, WAV, OGG, M4A)', 'error');
            return;
        }
        
        if (file.size > maxSize) {
            showStatus('Ukuran file terlalu besar. Maksimal 50MB', 'error');
            return;
        }
        
        setIsUploading(true);
        setUploadProgress(0);
        showStatus('Mengunggah file...', 'info');

        const formData = new FormData();
        formData.append('audio', file);

        try {
            console.log('Starting upload for file:', {
                name: file.name,
                type: file.type,
                size: file.size
            });

            const response = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
                timeout: 300000, // 5 minutes timeout
            });

            console.log('Upload response:', response.data);

            const { url, public_id } = response.data;
            
            if (!url) {
                throw new Error('No URL returned from server');
            }
            
            // Refresh announcements list from Blob storage after successful upload
            await fetchAnnouncementsFromBlob();
            
            e.target.value = ''; // Clear file input
            setIsUploading(false);
            setUploadProgress(0);
            showStatus('Pengumuman berhasil diunggah ke Vercel Blob!', 'success');

        } catch (error) {
            console.error('Upload failed:', error);
            
            let errorMessage = 'Gagal mengunggah file';
            
            if (error.response) {
                // Server responded with error status
                const serverError = error.response.data;
                errorMessage = serverError.message || errorMessage;
                
                if (serverError.error === 'Missing BLOB_READ_WRITE_TOKEN environment variable') {
                    errorMessage = 'Konfigurasi Vercel Blob belum diatur. Periksa environment variables.';
                } else if (error.response.status === 413) {
                    errorMessage = 'File terlalu besar untuk diunggah';
                } else if (error.response.status === 400) {
                    errorMessage = serverError.message || 'Format file tidak valid';
                }
                
                console.error('Server error details:', serverError);
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
                console.error('Network error:', error.request);
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Upload timeout. File terlalu besar atau koneksi lambat.';
            } else {
                // Something else happened
                errorMessage = error.message || errorMessage;
                console.error('Unexpected error:', error);
            }
            
            showStatus(errorMessage, 'error');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="container">
            <header>
                <h1><i className="fas fa-hospital"></i> RAYHAN HOSPITAL</h1>
                <p>Putar pengumuman secara periodik dengan dukungan waktu shalat</p>
                <div className="time-display">
                    <span id="currentDate">{currentDate}</span>
                    <span className="separator">•</span>
                    <span id="currentTime">{currentTime}</span>
                </div>
            </header>

            <div className="dashboard">
                <div className="card">
                    <h2><i className="fas fa-clock"></i> Jadwal Waktu Shalat</h2>
                    <div className="prayer-times">
                        {Object.entries(currentPrayerTimes).map(([prayer, time]) => {
                            const now = new Date();
                            const [prayerHour, prayerMinute] = time.split(':').map(Number);
                            const prayerTimeObj = new Date();
                            prayerTimeObj.setHours(prayerHour, prayerMinute, 0, 0);
                            const prayerEndTime = new Date(prayerTimeObj.getTime() + 30 * 60000);
                            const isActive = now >= prayerTimeObj && now <= prayerEndTime;

                            return (
                                <div key={prayer} className={`prayer-time ${isActive ? 'active blinking' : ''}`}>
                                    <span className="prayer-name">{getPrayerName(prayer)}</span>
                                    <span className="prayer-time" data-prayer={prayer}>{time}</span>
                                    {isActive && (
                                        <span className="prayer-indicator">
                                            <i className="fas fa-mosque"></i> Waktu Sholat
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="now-playing" style={{ display: isPlaying ? 'block' : 'none' }}>
                        <strong><i className="fas fa-volume-up"></i> Sedang Bermain:</strong>
                        <span id="currentAnnouncement">
                            {announcements[currentAnnouncementIndex]?.name || 'Tidak ada'}
                        </span>
                    </div>

                    <audio ref={audioRef} controls style={{ display: 'none' }}></audio>

                    <div className="countdown-display">
                        <div>Pemutaran berikutnya dalam:</div>
                        <div id="countdownTime">
                            {`${Math.floor(countdownSeconds / 60).toString().padStart(2, '0')}:${(countdownSeconds % 60).toString().padStart(2, '0')}`}
                        </div>
                    </div>

                    {status.message && (
                        <div className={`status ${status.type}`}>
                            {status.message}
                        </div>
                    )}
                </div>

                <div className="card">
                    <h2><i className="fas fa-cog"></i> Kontrol Pengumuman</h2>
                    <div className="announcement-controls">
                        <div className="control-group">
                            <label htmlFor="playInterval">Interval Pemutaran (menit)</label>
                            <select id="playInterval" defaultValue="15">
                                <option value="1">1 menit</option>
                                <option value="5">5 menit</option>
                                <option value="15">15 menit</option>
                                <option value="30">30 menit</option>
                                <option value="60">60 menit</option>
                            </select>
                        </div>

                        <div className="control-group">
                            <label htmlFor="volumeControl">Volume</label>
                            <input 
                                type="range" 
                                id="volumeControl" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                defaultValue="0.7"
                                onChange={(e) => { if(audioRef.current) audioRef.current.volume = e.target.value; }}
                            />
                        </div>

                        <button id="startBtn" className="btn-primary" onClick={startPlayback}>
                            <i className="fas fa-play"></i> Mulai Pemutaran
                        </button>
                        <button id="stopBtn" className="btn-danger" onClick={stopPlayback}>
                            <i className="fas fa-stop"></i> Hentikan Pemutaran
                        </button>

                        <h3 style={{ marginTop: '20px' }}><i className="fas fa-upload"></i> Unggah File</h3>
                        <div className="upload-area" onClick={() => document.getElementById('fileInput').click()}>
                            <i className="fas fa-cloud-upload-alt"></i>
                            <p>Klik atau tarik file ke sini untuk mengunggah</p>
                            <p className="small">Format yang didukung: MP3, WAV</p>
                            <input type="file" id="fileInput" accept="audio/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                            {isUploading && (
                                <div className="progress" style={{ display: 'block' }}>
                                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2><i className="fas fa-list"></i> Daftar File</h2>
                <div className="announcement-list">
                    {announcements.length === 0 ? (
                        <p>Belum ada pengumuman. Silakan unggah file audio.</p>
                    ) : (
                        announcements.map((announcement, index) => (
                            <div 
                                key={announcement.url} 
                                className={`announcement-item ${index === currentAnnouncementIndex && isPlaying ? 'active' : ''}`}
                            >
                                <span>{announcement.name}</span>
                                <div className="announcement-actions">
                                    <button className="btn-primary play-btn" onClick={() => playAnnouncement(index)}>
                                        <i className="fas fa-play"></i>
                                    </button>
                                    <button className="btn-danger delete-btn" onClick={() => deleteAnnouncement(index)}>
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <footer>
                &copy; 2023 Sistem Pemutaran Pengumuman Otomatis | 
                Dibangun dengan <i className="fas fa-heart" style={{ color: '#e74c3c' }}></i> Rayhan Hospital
            </footer>
        </div>
    );
}

export default App;
