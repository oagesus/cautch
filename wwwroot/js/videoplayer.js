// Global video player state
window.videoPlayer = {
    video: null,
    container: null,
    hideControlsTimer: null,
    isInitialized: false,
    updateInterval: null,
    lastClickTime: 0,
    clickTimer: null,
    centerControlsElement: null,
    timeTooltip: null,
    
    // Reset the player state completely
    reset: function() {
        console.log('Resetting video player...');
        
        if (this.hideControlsTimer) {
            clearTimeout(this.hideControlsTimer);
            this.hideControlsTimer = null;
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
            this.clickTimer = null;
        }
        
        this.cleanup();
        
        if (this.centerControlsElement) {
            this.centerControlsElement.remove();
            this.centerControlsElement = null;
        }
        
        if (this.timeTooltip) {
            this.timeTooltip.remove();
            this.timeTooltip = null;
        }
        
        this.video = null;
        this.container = null;
        this.isInitialized = false;
        this.lastClickTime = 0;
        
        const container = document.querySelector('.custom-video-container');
        if (container) {
            container.classList.remove('controls-visible');
            container.style.cursor = 'none';
        }
    },
    
    // Initialize the video player
    init: function() {
        this.reset();
        const video = document.querySelector('.custom-video');
        const container = document.querySelector('.custom-video-container');
        if (!video || !container) {
            console.log('Video or container not found, retrying...');
            setTimeout(() => this.init(), 100);
            return false;
        }

        this.video = video;
        this.container = container;

        this.setupClickHandler();
        this.setupKeyboardHandler();
        this.setupFullscreenHandler();
        this.setupMouseHandler();
        this.setupCenterControls();
        this.setupProgressBarDrag();
        this.setupProgressBarHover();
        this.setupVideoEventListeners();

        this.updateInterval = setInterval(() => {
            if (this.video && window.blazorVideoUpdate) {
                window.blazorVideoUpdate();
            }
        }, 100);

        // Initial Controls anzeigen für 3 Sekunden
        this.showControlsTemporarily();

        this.isInitialized = true;
        console.log('Video player initialized successfully');
        return true;
    },
    
    // Setup video event listeners for play/pause
    setupVideoEventListeners: function() {
        if (!this.video) return;
        
        // Bei Pause: Controls für 3 Sekunden anzeigen
        this.video.addEventListener('pause', () => {
            this.showControlsTemporarily();
        });
        
        // Bei Play: Controls für 3 Sekunden anzeigen
        this.video.addEventListener('play', () => {
            this.showControlsTemporarily();
        });
    },
    
    // Zeigt Controls für 3 Sekunden an und blendet sie dann aus
    showControlsTemporarily: function() {
        // Bestehenden Timer löschen
        if (this.hideControlsTimer) {
            clearTimeout(this.hideControlsTimer);
            this.hideControlsTimer = null;
        }
        
        // Controls einblenden
        this.showControls();
        
        // Wenn wir am Dragging sind, keinen Timer setzen
        if (this._isDraggingProgressBar || this._volumeInteracting || this._speedInteracting) {
            return;
        }
        
        // Nach 3 Sekunden ausblenden (immer, auch auf Desktop und bei Pause)
        this.hideControlsTimer = setTimeout(() => {
            this.hideControls(false);
            this.hideControlsTimer = null;
        }, 3000);
    },
    
    setupProgressBarHover: function() {
        const progressContainer = document.querySelector('.progress-container');
        if (!progressContainer) return;

        // Erstelle Tooltip-Element wenn es noch nicht existiert
        if (!this.timeTooltip) {
            this.timeTooltip = document.createElement('div');
            this.timeTooltip.className = 'video-time-tooltip';
            this.timeTooltip.style.cssText = `
                position: absolute;
                bottom: 100%;
                margin-bottom: 10px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                font-family: 'Segoe UI', sans-serif;
                pointer-events: none;
                opacity: 0;
                transform: translateX(-50%);
                transition: opacity 0.2s ease;
                white-space: nowrap;
                z-index: 100;
            `;
            progressContainer.appendChild(this.timeTooltip);
        }

        const updateTooltip = (clientX) => {
            if (!this.video || !this.video.duration) return;

            const rect = progressContainer.getBoundingClientRect();
            const posX = clientX - rect.left;
            const percent = Math.max(0, Math.min(1, posX / rect.width));
            const time = percent * this.video.duration;

            // Formatiere Zeit
            const timeStr = this.formatTime(time);
            
            // Aktualisiere Tooltip
            this.timeTooltip.textContent = timeStr;
            this.timeTooltip.style.left = `${posX}px`;
            this.timeTooltip.style.opacity = '1';
        };

        const hideTooltip = () => {
            if (this.timeTooltip) {
                this.timeTooltip.style.opacity = '0';
            }
        };

        // Mousemove Handler für Desktop (nur wenn nicht am Dragging)
        this.progressHoverHandler = (e) => {
            // Nur bei hover zeigen, nicht beim Drag (das macht setupProgressBarDrag)
            if (!progressContainer.classList.contains('dragging')) {
                updateTooltip(e.clientX);
                progressContainer.classList.add('hovering');
            }
        };

        // Mouseleave Handler für Desktop
        this.progressLeaveHandler = () => {
            if (!progressContainer.classList.contains('dragging')) {
                hideTooltip();
                progressContainer.classList.remove('hovering');
            }
        };

        // Desktop Events (nur hover, kein drag)
        progressContainer.addEventListener('mousemove', this.progressHoverHandler);
        progressContainer.addEventListener('mouseleave', this.progressLeaveHandler);
    },

    formatTime: function(seconds) {
        const time = Math.floor(seconds);
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const secs = time % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },
    
    setupCenterControls: function() {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (isTouchDevice && this.container) {
            this.centerControlsElement = document.createElement('div');
            this.centerControlsElement.className = 'video-center-controls';
            this.centerControlsElement.innerHTML = `
                <button class="center-play-pause-btn" type="button" aria-label="Play/Pause">
                    <svg class="play-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <svg class="pause-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                </button>
            `;

            if (!document.querySelector('#video-center-controls-style')) {
                const style = document.createElement('style');
                style.id = 'video-center-controls-style';
                style.textContent = `
                    .video-center-controls {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        z-index: 9999;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                        pointer-events: none;
                    }

                    .custom-video-container.controls-visible .video-center-controls {
                        opacity: 1;
                        pointer-events: auto;
                    }

                    .center-play-pause-btn {
                        background: rgba(0, 0, 0, 0.6);
                        border: 2px solid rgba(255, 255, 255, 0.8);
                        border-radius: 50%;
                        width: 80px;
                        height: 80px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: transform 0.2s ease, opacity 0.2s ease;
                    }

                    .center-play-pause-btn:active { transform: scale(0.92); }

                    .center-play-pause-btn svg { width: 40px; height: 40px; fill: white; }

                    .center-play-pause-btn .play-icon { display: none; margin-left: 4px; }
                    .center-play-pause-btn .pause-icon { display: block; }
                `;
                document.head.appendChild(style);
            }

            this.container.appendChild(this.centerControlsElement);

            const centerBtn = this.centerControlsElement.querySelector('.center-play-pause-btn');
            this._centerBtn = centerBtn;

            this._onCenterBtnClick = (e) => {
                e.stopPropagation();
                this.togglePlayPauseWithFeedback();
                
                // Speed-Menü schließen wenn auf Center-Button geklickt wird
                if (window.speedMenuDotNetRef) {
                    window.speedMenuDotNetRef.invokeMethodAsync('CloseSpeedMenuFromJS');
                }
            };
            centerBtn.addEventListener('click', this._onCenterBtnClick);

            this.setCenterButtonState(this.video ? this.video.paused : true);

            this._onVideoPlay = () => this.setCenterButtonState(false);
            this._onVideoPause = () => this.setCenterButtonState(true);

            if (this.video) {
                this.video.addEventListener('play', this._onVideoPlay);
                this.video.addEventListener('pause', this._onVideoPause);
            }
        }
    },

    setCenterButtonState: function(paused) {
        if (!this.centerControlsElement) return;
        const btn = this.centerControlsElement.querySelector('.center-play-pause-btn');
        if (!btn) return;
        const playIcon = btn.querySelector('.play-icon');
        const pauseIcon = btn.querySelector('.pause-icon');

        if (playIcon) playIcon.style.display = paused ? 'block' : 'none';
        if (pauseIcon) pauseIcon.style.display = paused ? 'none' : 'block';
    },
    
    updateCenterControls: function() {
        if (this.centerControlsElement && this.video && this.container) {
            if (this.container.classList.contains('controls-visible')) {
                if (this.video.paused) {
                    this.container.classList.add('video-paused');
                } else {
                    this.container.classList.remove('video-paused');
                }
            }
        }
    },
    
    setupClickHandler: function() {
        if (!this.container) return;

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        this.clickHandler = (e) => {
            if (
                e.target.closest('.video-controls') || 
                e.target.closest('.video-top-bar') ||
                e.target.closest('.video-center-controls')
            ) {
                return;
            }

            if (isTouchDevice) {
                e.preventDefault();
            }

            // Timer immer löschen beim Klick
            if (this.hideControlsTimer) {
                clearTimeout(this.hideControlsTimer);
                this.hideControlsTimer = null;
            }

            if (!isTouchDevice) {
                // Desktop: Double-click für Fullscreen, Single-click für Play/Pause
                const currentTime = Date.now();
                const timeSinceLastClick = currentTime - this.lastClickTime;

                if (this.clickTimer) {
                    clearTimeout(this.clickTimer);
                    this.clickTimer = null;
                }

                if (timeSinceLastClick < 300) {
                    // Doppelklick: Fullscreen
                    this.toggleFullscreen();
                    this.lastClickTime = 0;
                } else {
                    // Einzelklick: Play/Pause
                    this.clickTimer = setTimeout(() => {
                        this.togglePlayPauseWithFeedback();
                        this.clickTimer = null;
                    }, 300);
                    this.lastClickTime = currentTime;
                }
            } else {
                // Mobile: Controls togglen mit 3 Sekunden Timer
                if (this.container.classList.contains('controls-visible')) {
                    this.hideControls(false);
                    // Auf Mobile: Speed-Menü auch schließen
                    if (window.speedMenuDotNetRef) {
                        window.speedMenuDotNetRef.invokeMethodAsync('CloseSpeedMenuFromJS');
                    }
                } else {
                    this.showControlsTemporarily();
                }
            }
        };

        if (isTouchDevice) {
            this.container.addEventListener('touchstart', this.clickHandler, { passive: false });
        } else {
            this.container.addEventListener('click', this.clickHandler);
        }
    },
    
    togglePlayPauseWithFeedback: function() {
        if (!this.video || !this.isInitialized) return;

        const wasPlaying = !this.video.paused;
        this.togglePlayPause();

        this.showPlayPauseFeedback(!wasPlaying);

        setTimeout(() => {
            this.setCenterButtonState(this.video.paused);
        }, 40);
    },
    
    showPlayPauseFeedback: function(isPlaying) {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) {
            this.showFeedback(isPlaying ? 'play' : 'pause', 'center');
        }
    },
    
    showSkipFeedback: function(direction) {
        this.showFeedback(direction > 0 ? 'forward' : 'backward', direction > 0 ? 'right' : 'left');
    },
    
    showFeedback: function(type, position = 'center') {
        const existingFeedback = document.querySelector('.video-feedback-icon');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        const feedback = document.createElement('div');
        feedback.className = `video-feedback-icon video-feedback-${position}`;
        
        if (type === 'play') {
            feedback.innerHTML = `
                <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="white" d="M8 5v14l11-7z"/>
                </svg>
            `;
        } else if (type === 'pause') {
            feedback.innerHTML = `
                <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="white" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
            `;
        } else if (type === 'forward') {
            feedback.innerHTML = `
                <svg viewBox="0 0 24 24" width="48" height="48" fill="white">
                    <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6s2.69-6 6-6v4l5-5l-5-5v4c-4.42 0-8 3.58-8 8c0 4.42 3.58 8 8 8c4.42 0 8-3.58 8-8H18z"/>
                    <path d="M10.86 15.94l0-4.27l-0.09 0l-1.77 0.63v0.69l1.01-0.31l0 3.26z"/>
                    <path d="M12.25 13.44v0.74c0 1.9 1.31 1.82 1.44 1.82c0.14 0 1.44 0.09 1.44-1.82v-0.74c0-1.9-1.31-1.82-1.44-1.82C13.55 11.62 12.25 11.53 12.25 13.44zM14.29 13.32v0.97c0 0.77-0.21 1.03-0.59 1.03c-0.38 0-0.6-0.26-0.6-1.03v-0.97c0-0.75 0.22-1.01 0.59-1.01C14.07 12.3 14.29 12.57 14.29 13.32z"/>
                </svg>
            `;
        } else if (type === 'backward') {
            feedback.innerHTML = `
                <svg viewBox="0 0 24 24" width="48" height="48" fill="white">
                    <path d="M11.99 5V1l-5 5l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6s-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8S16.41 5 11.99 5z"/>
                    <path d="M10.89 16h-0.85v-3.26l-1.01 0.31v-0.69l1.77-0.63h0.09V16z"/>
                    <path d="M15.17 14.24c0 0.32-0.03 0.6-0.1 0.82s-0.17 0.42-0.29 0.57s-0.28 0.26-0.45 0.33s-0.37 0.1-0.59 0.1s-0.41-0.03-0.59-0.1s-0.33-0.18-0.46-0.33s-0.23-0.34-0.3-0.57s-0.11-0.5-0.11-0.82V13.5c0-0.32 0.03-0.6 0.1-0.82s0.17-0.42 0.29-0.57s0.28-0.26 0.45-0.33s0.37-0.1 0.59-0.1s0.41 0.03 0.59 0.1c0.18 0.07 0.33 0.18 0.46 0.33s0.23 0.34 0.3 0.57s0.11 0.5 0.11 0.82V14.24zM14.32 13.38c0-0.19-0.01-0.35-0.04-0.48s-0.07-0.23-0.12-0.31s-0.11-0.14-0.19-0.17s-0.16-0.05-0.25-0.05s-0.18 0.02-0.25 0.05s-0.14 0.09-0.19 0.17s-0.09 0.18-0.12 0.31s-0.04 0.29-0.04 0.48v0.97c0 0.19 0.01 0.35 0.04 0.48s0.07 0.24 0.12 0.32s0.11 0.14 0.19 0.17s0.16 0.05 0.25 0.05s0.18-0.02 0.25-0.05s0.14-0.09 0.19-0.17s0.09-0.19 0.11-0.32s0.04-0.29 0.04-0.48V13.38z"/>
                </svg>
            `;
        }
        
        if (this.container) {
            this.container.appendChild(feedback);
            
            setTimeout(() => {
                feedback.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                feedback.classList.add('hide');
                setTimeout(() => {
                    feedback.remove();
                }, 200);
            }, 300);
        }
    },
    
    setupMouseHandler: function() {
        if (!this.container) return;
        
        this.mouseHandler = () => {
            this.handleMouseMove();
        };
        
        this.mouseLeaveHandler = () => {
            this.handleMouseLeave();
        };
        
        this.container.addEventListener('mousemove', this.mouseHandler);
        this.container.addEventListener('mouseleave', this.mouseLeaveHandler);
    },
    
    handleMouseLeave: function() {
        if (!this.container || !this.isInitialized) return;
        
        // Timer löschen
        if (this.hideControlsTimer) {
            clearTimeout(this.hideControlsTimer);
            this.hideControlsTimer = null;
        }
        
        // Controls nach 3 Sekunden ausblenden
        this.hideControlsTimer = setTimeout(() => {
            this.hideControls(false);
            this.hideControlsTimer = null;
        }, 3000);
    },
    
    setupKeyboardHandler: function() {
        this.keyHandler = (e) => {
            if (!this.video || !this.isInitialized) return;
            
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            let handled = true;
            
            switch(e.key) {
                case ' ':
                case 'Spacebar':
                    e.preventDefault();
                    e.stopPropagation();
                    this.togglePlayPauseWithFeedback();
                    break;
                    
                case 'ArrowLeft':
                    e.preventDefault();
                    e.stopPropagation();
                    this.skip(-10);
                    this.showSkipFeedback(-10);
                    break;
                    
                case 'ArrowRight':
                    e.preventDefault();
                    e.stopPropagation();
                    this.skip(10);
                    this.showSkipFeedback(10);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    e.stopPropagation();
                    this.changeVolume(0.1);
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    e.stopPropagation();
                    this.changeVolume(-0.1);
                    break;
                    
                case 'm':
                case 'M':
                    e.preventDefault();
                    this.toggleMute();
                    break;
                    
                case 'f':
                case 'F':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                    
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    e.preventDefault();
                    const percent = parseInt(e.key) * 10;
                    this.seekToPercent(percent);
                    break;
                    
                default:
                    handled = false;
            }
            
            if (handled) {
                this.notifyBlazor('keyaction', { key: e.key });
            }
        };
        
        document.removeEventListener('keydown', this.keyHandler, true);
        document.addEventListener('keydown', this.keyHandler, true);
    },

    setupProgressBarDrag: function() {
        const progressContainer = document.querySelector('.progress-container');
        if (!progressContainer || !this.video) return;

        let isDragging = false;
        let wasPlaying = false;

        const getClientX = (e) => {
            if (e.touches && e.touches.length > 0) {
                return e.touches[0].clientX;
            }
            if (e.changedTouches && e.changedTouches.length > 0) {
                return e.changedTouches[0].clientX;
            }
            return e.clientX;
        };

        // Zeige Tooltip und weißen Punkt während Drag
        const updateVisuals = (clientX) => {
            if (!this.video || !this.video.duration) return;

            const rect = progressContainer.getBoundingClientRect();
            const posX = clientX - rect.left;
            const percent = Math.max(0, Math.min(1, posX / rect.width));
            const time = percent * this.video.duration;

            // Update Tooltip
            if (this.timeTooltip) {
                const timeStr = this.formatTime(time);
                this.timeTooltip.textContent = timeStr;
                this.timeTooltip.style.left = `${posX}px`;
                this.timeTooltip.style.opacity = '1';
            }

            // Zeige weißen Punkt (durch hover-Klasse)
            progressContainer.classList.add('dragging');
        };

        const hideVisuals = () => {
            if (this.timeTooltip) {
                this.timeTooltip.style.opacity = '0';
            }
            progressContainer.classList.remove('dragging');
        };

        // Funktion um Timer während Dragging zu verhindern
        const preventTimerDuringDrag = () => {
            if (this.hideControlsTimer) {
                clearTimeout(this.hideControlsTimer);
                this.hideControlsTimer = null;
            }
        };

        const startDrag = (clientX) => {
            isDragging = true;
            
            // Merke ob Video gerade spielt
            wasPlaying = !this.video.paused;
            
            // Pausiere Video beim Start des Draggings
            if (wasPlaying) {
                this.video.pause();
            }
            
            // Timer löschen während des Draggings
            preventTimerDuringDrag();
            
            // Flag setzen dass wir am Dragging sind
            this._isDraggingProgressBar = true;
            
            updateVisuals(clientX);
            this.seekByClick(clientX);
        };

        const moveDrag = (clientX) => {
            if (!isDragging) return;
            
            // Während des Draggings immer Timer löschen
            preventTimerDuringDrag();
            
            updateVisuals(clientX);
            this.seekByClick(clientX);
        };

        const endDrag = (clientX) => {
            if (!isDragging) return;
            isDragging = false;
            
            // Flag zurücksetzen
            this._isDraggingProgressBar = false;
            
            this.seekByClick(clientX);
            
            // Wenn Video vorher gespielt hat, spiele es wieder ab
            if (wasPlaying) {
                this.video.play().catch(err => console.log('Play error:', err));
            }
            
            // Kurze Verzögerung bevor Visuals ausgeblendet werden
            setTimeout(hideVisuals, 300);
            
            // Controls für weitere 3 Sekunden anzeigen nach dem Dragging
            this.showControlsTemporarily();
        };

        const onMouseDown = (e) => {
            startDrag(e.clientX);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => moveDrag(e.clientX);

        const onMouseUp = (e) => {
            endDrag(e.clientX);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        const onTouchStart = (e) => {
            startDrag(getClientX(e));
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
            document.addEventListener('touchcancel', onTouchCancel);
        };

        const onTouchMove = (e) => {
            e.preventDefault();
            moveDrag(getClientX(e));
        };

        const onTouchEnd = (e) => {
            endDrag(getClientX(e));
            removeTouchListeners();
        };

        const onTouchCancel = () => {
            isDragging = false;
            
            // Flag zurücksetzen
            this._isDraggingProgressBar = false;
            
            // Bei Cancel auch prüfen ob Video wieder abgespielt werden soll
            if (wasPlaying) {
                this.video.play().catch(err => console.log('Play error:', err));
            }
            
            hideVisuals();
            removeTouchListeners();
            
            // Controls für weitere 3 Sekunden anzeigen
            this.showControlsTemporarily();
        };

        const removeTouchListeners = () => {
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
            document.removeEventListener('touchcancel', onTouchCancel);
        };

        progressContainer.addEventListener('mousedown', onMouseDown);
        progressContainer.addEventListener('touchstart', onTouchStart, { passive: false });
        
        // Store references for cleanup
        this._dragMouseDown = onMouseDown;
        this._dragTouchStart = onTouchStart;
    },
    
    setupFullscreenHandler: function() {
        this.fullscreenHandler = () => {
            const isFullscreen = !!document.fullscreenElement;
            this.notifyBlazor('fullscreenchange', { isFullscreen });
        };
        
        document.removeEventListener('fullscreenchange', this.fullscreenHandler);
        document.addEventListener('fullscreenchange', this.fullscreenHandler);
    },
    
    togglePlayPause: function() {
        if (!this.video || !this.isInitialized) return false;
        
        if (this.video.paused) {
            this.video.play().catch(err => console.log('Play error:', err));
        } else {
            this.video.pause();
        }
        
        setTimeout(() => {
            this.setCenterButtonState(this.video ? this.video.paused : true);
        }, 10);
        
        return !this.video.paused;
    },
    
    play: function() {
        if (!this.video || !this.isInitialized) return;
        const promise = this.video.play();
        setTimeout(() => this.setCenterButtonState(this.video.paused), 50);
        return promise;
    },
    
    pause: function() {
        if (!this.video || !this.isInitialized) return;
        this.video.pause();
        setTimeout(() => this.setCenterButtonState(this.video.paused), 10);
    },
    
    skip: function(seconds) {
        if (!this.video || !this.isInitialized) return;
        
        const newTime = Math.max(0, Math.min(this.video.duration || 0, this.video.currentTime + seconds));
        this.video.currentTime = newTime;
    },
    
    seekToTime: function(time) {
        if (!this.video || !this.isInitialized) return;
        this.video.currentTime = Math.max(0, Math.min(this.video.duration || 0, time));
    },
    
    seek: function(time) {
        this.seekToTime(time);
    },
    
    seekToPercent: function(percent) {
        if (!this.video || !this.video.duration || !this.isInitialized) return;
        
        const time = (percent / 100) * this.video.duration;
        this.seekToTime(time);
    },
    
    seekByClick: function(clientX) {
        const progressContainer = document.querySelector('.progress-container');
        if (!progressContainer || !this.video || !this.isInitialized) return;
        
        const rect = progressContainer.getBoundingClientRect();
        const clickX = clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
        this.seekToPercent(percent);
    },
    
    changeVolume: function(delta) {
        if (!this.video || !this.isInitialized) return;
        
        const newVolume = Math.max(0, Math.min(1, this.video.volume + delta));
        this.video.volume = newVolume;
        
        if (newVolume === 0) {
            this.video.muted = true;
        } else if (this.video.muted) {
            this.video.muted = false;
        }
        
        this.notifyBlazor('volumechange', { volume: newVolume, muted: this.video.muted });
        
        // Benachrichtige Blazor über Keyboard-Volume-Änderung
        if (window.volumeChangeDotNetRef) {
            window.volumeChangeDotNetRef.invokeMethodAsync('OnVolumeChangeFromKeyboard', newVolume, this.video.muted);
        }
    },
    
    setVolume: function(volume) {
        if (!this.video || !this.isInitialized) return;
        
        this.video.volume = Math.max(0, Math.min(1, volume));
        
        if (volume === 0) {
            this.video.muted = true;
        } else if (this.video.muted) {
            this.video.muted = false;
        }
    },
    
    toggleMute: function() {
        if (!this.video || !this.isInitialized) return;
        
        this.video.muted = !this.video.muted;
        this.notifyBlazor('mutechange', { muted: this.video.muted });
    },
    
    setPlaybackRate: function(rate) {
        if (!this.video || !this.isInitialized) return;
        this.video.playbackRate = rate;
    },
    
    toggleFullscreen: function() {
        if (!this.container || !this.isInitialized) return;
        
        if (!document.fullscreenElement) {
            if (this.container.requestFullscreen) {
                this.container.requestFullscreen();
            } else if (this.container.webkitRequestFullscreen) {
                this.container.webkitRequestFullscreen();
            } else if (this.container.msRequestFullscreen) {
                this.container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    },
    
    getState: function() {
        if (!this.video || !this.isInitialized) {
            return {
                currentTime: 0,
                duration: 0,
                paused: true,
                muted: false,
                volume: 1,
                playbackRate: 1,
                buffered: 0,
                isFullscreen: false,
                showControls: true
            };
        }
        
        const container = document.querySelector('.custom-video-container');
        const showControls = container ? container.classList.contains('controls-visible') : false;
        
        let bufferedEnd = 0;
        if (this.video.buffered.length > 0) {
            const currentTime = this.video.currentTime;
            for (let i = 0; i < this.video.buffered.length; i++) {
                if (this.video.buffered.start(i) <= currentTime && 
                    this.video.buffered.end(i) >= currentTime) {
                    bufferedEnd = this.video.buffered.end(i);
                    break;
                }
            }
        }
        
        return {
            currentTime: this.video.currentTime || 0,
            duration: this.video.duration || 0,
            paused: this.video.paused,
            muted: this.video.muted,
            volume: this.video.volume,
            playbackRate: this.video.playbackRate,
            buffered: bufferedEnd,
            isFullscreen: !!document.fullscreenElement,
            showControls: showControls
        };
    },
    
    handleMouseMove: function() {
        if (!this.container || !this.isInitialized) return;
        
        // Controls einblenden & Mauszeiger zeigen
        this.showControls();
        
        // Vorhandenen Timer löschen
        if (this.hideControlsTimer) {
            clearTimeout(this.hideControlsTimer);
            this.hideControlsTimer = null;
        }

        // Wenn wir am Dragging sind, keinen neuen Timer setzen
        if (this._isDraggingProgressBar || this._volumeInteracting || this._speedInteracting) {
            return;
        }

        // Neuen Timer setzen (3 Sekunden)
        this.hideControlsTimer = setTimeout(() => {
            this.hideControls(false);
            this.hideControlsTimer = null;
        }, 3000);
    },
    
    showControls: function() {
        if (this.container) {
            this.container.classList.add('controls-visible');

            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            if (!isTouchDevice) {
                this.container.style.cursor = 'auto';
            }

            this.setCenterButtonState(this.video ? this.video.paused : true);
        }
    },

    hideControls: function(immediate = false) {
        if (!this.container) return;

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        this.container.classList.remove('controls-visible');

        if (!isTouchDevice) {
            this.container.style.cursor = 'none';
        }
        
        if (window.speedMenuDotNetRef) {
            window.speedMenuDotNetRef.invokeMethodAsync('CloseSpeedMenuFromJS');
        }
    },
    
    notifyBlazor: function(eventType, data) {
        window.dispatchEvent(new CustomEvent('videoplayer:' + eventType, { detail: data }));
        
        if (window.blazorVideoCallback) {
            try {
                window.blazorVideoCallback(eventType, data);
            } catch(e) {
                console.log('Blazor callback error:', e);
            }
        }
    },
    
    cleanup: function() {
        console.log('Cleaning up video player...');

        if (this.clickHandler && this.container) {
            this.container.removeEventListener('click', this.clickHandler);
            this.container.removeEventListener('touchstart', this.clickHandler);
            this.clickHandler = null;
        }
        
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler, true);
            this.keyHandler = null;
        }
        
        if (this.fullscreenHandler) {
            document.removeEventListener('fullscreenchange', this.fullscreenHandler);
            this.fullscreenHandler = null;
        }
        
        if (this.mouseHandler && this.container) {
            this.container.removeEventListener('mousemove', this.mouseHandler);
            this.mouseHandler = null;
        }
        
        if (this.mouseLeaveHandler && this.container) {
            this.container.removeEventListener('mouseleave', this.mouseLeaveHandler);
            this.mouseLeaveHandler = null;
        }

        // Cleanup progress bar hover handlers
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            if (this.progressHoverHandler) {
                progressContainer.removeEventListener('mousemove', this.progressHoverHandler);
                this.progressHoverHandler = null;
            }
            if (this.progressLeaveHandler) {
                progressContainer.removeEventListener('mouseleave', this.progressLeaveHandler);
                this.progressLeaveHandler = null;
            }
            if (this._dragMouseDown) {
                progressContainer.removeEventListener('mousedown', this._dragMouseDown);
                this._dragMouseDown = null;
            }
            if (this._dragTouchStart) {
                progressContainer.removeEventListener('touchstart', this._dragTouchStart);
                this._dragTouchStart = null;
            }
        }
        
        if (this.hideControlsTimer) {
            clearTimeout(this.hideControlsTimer);
            this.hideControlsTimer = null;
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
            this.clickTimer = null;
        }
        
        if (this.centerControlsElement) {
            this.centerControlsElement.remove();
            this.centerControlsElement = null;
        }

        if (this.timeTooltip) {
            this.timeTooltip.remove();
            this.timeTooltip = null;
        }

        if (this._centerBtn && this._onCenterBtnClick) {
            try { this._centerBtn.removeEventListener('click', this._onCenterBtnClick); } catch(e){ }
            this._centerBtn = null;
            this._onCenterBtnClick = null;
        }

        if (this.video && this._onVideoPlay) {
            try { this.video.removeEventListener('play', this._onVideoPlay); } catch(e){ }
            this._onVideoPlay = null;
        }
        if (this.video && this._onVideoPause) {
            try { this.video.removeEventListener('pause', this._onVideoPause); } catch(e){ }
            this._onVideoPause = null;
        }
        
        this.isInitialized = false;
    }
};

// Legacy support for old function names
window.setupVideoKeyHandler = () => window.videoPlayer.init();
window.cleanupVideoKeyHandler = () => window.videoPlayer.cleanup();

// ========================================
// Speed Menu Click Outside Handler
// ========================================
window.speedMenuClickHandler = null;
window.speedMenuDotNetRef = null;

window.setupSpeedMenuClickOutside = function(dotNetReference) {
    window.speedMenuDotNetRef = dotNetReference;
    
    window.speedMenuClickHandler = function(e) {
        // Prüfe ob Klick außerhalb des Speed-Controls ist
        if (!e.target.closest('.speed-control')) {
            // Rufe die Blazor-Methode auf
            if (window.speedMenuDotNetRef) {
                window.speedMenuDotNetRef.invokeMethodAsync('CloseSpeedMenuFromJS');
            }
        }
    };
    
    // Event Listener hinzufügen
    document.addEventListener('click', window.speedMenuClickHandler);
    console.log('Speed menu click outside handler setup');
};

window.cleanupSpeedMenuClickOutside = function() {
    if (window.speedMenuClickHandler) {
        document.removeEventListener('click', window.speedMenuClickHandler);
        window.speedMenuClickHandler = null;
    }
    window.speedMenuDotNetRef = null;
    console.log('Speed menu click outside handler cleaned up');
};
// ========================================
// Volume Change Callback
// ========================================
window.volumeChangeDotNetRef = null;

window.setupVolumeChangeCallback = function(dotNetReference) {
    window.volumeChangeDotNetRef = dotNetReference;
    console.log('Volume change callback setup');
};

window.cleanupVolumeChangeCallback = function() {
    window.volumeChangeDotNetRef = null;
    console.log('Volume change callback cleaned up');
};