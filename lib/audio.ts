/**
 * Audio playback utility optimized for Android WebView.
 * Uses a singleton HTMLAudioElement to avoid WebView restrictions
 * on creating multiple audio instances.
 */

let audioElement: HTMLAudioElement | null = null;

function getAudioElement(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.setAttribute('playsinline', '');
    audioElement.setAttribute('preload', 'none');
    // Append to DOM for better WebView compatibility
    audioElement.style.display = 'none';
    document.body.appendChild(audioElement);
  }
  return audioElement;
}

/**
 * Play pronunciation audio from a URL.
 * Uses a single reusable audio element for WebView compatibility.
 * Must be called from a user gesture (click/tap) handler.
 */
export async function playPronunciation(url: string): Promise<void> {
  if (!url) return;

  try {
    const audio = getAudioElement();

    // Stop any currently playing audio
    audio.pause();
    audio.currentTime = 0;

    // Set the new source
    audio.src = url;
    audio.crossOrigin = 'anonymous';

    // Wait for enough data to play
    await new Promise<void>((resolve, reject) => {
      const onCanPlay = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        resolve();
      };
      const onError = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        // Try playing anyway — some WebViews fire error but still play
        resolve();
      };

      audio.addEventListener('canplaythrough', onCanPlay);
      audio.addEventListener('error', onError);
      audio.load();

      // Timeout fallback — don't wait forever
      setTimeout(resolve, 2000);
    });

    await audio.play();
  } catch (error) {
    console.warn('[Audio] Playback failed, trying fallback:', error);

    // Fallback: create a fresh Audio object
    try {
      const fallback = new Audio(url);
      fallback.crossOrigin = 'anonymous';
      await fallback.play();
    } catch (fallbackError) {
      console.error('[Audio] Fallback also failed:', fallbackError);
    }
  }
}
