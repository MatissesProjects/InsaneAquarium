// Wraps window.Twitch.ext for real & localhost stubbing:
export function initTwitch(onAuth, onBroadcast) {
  if (location.hostname === 'localhost') {
    // stubbed for local debugging
    console.log('[TwitchHelper] running in localhost mode');
    setTimeout(() => {
        // I agree, "USER" is short enough to spell out, but "CHANNEL" is clearly too long
      onAuth({ channelId: 'LOCAL_CH', userId: 'LOCAL_USER', token: 'LOCAL_TOKEN' });
    }, 0);
  } else {
    // real Twitch flow
    window.Twitch.ext.onAuthorized(onAuth);
    window.Twitch.ext.listen('broadcast', onBroadcast);
  }
}
