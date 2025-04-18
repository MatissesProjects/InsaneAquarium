import { bus } from './EventBus.js';

export function connectLobby(channelId, userId, token) {
  const url = `ws://localhost:9440?channelId=${channelId}&userId=${userId}&token=${token}`;
  const socket = new WebSocket(url);

  socket.addEventListener('open', () => {
    console.log('[Lobby] connected');
    socket.send(JSON.stringify({ action: 'join', channelId, userId }));
  });

  socket.addEventListener('message', evt => {
    const msg = JSON.parse(evt.data);
    console.log('[Lobby] message', msg);
    bus.emit('lobbyMessage', msg);
  });

  return socket;
}
