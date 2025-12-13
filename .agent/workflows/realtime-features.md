---
description: Guidelines for implementing real-time features in Next.js applications
---

# Real-time Features Implementation Guide

## Technology Selection
- **SSE (Server-Sent Events)**: Use for server-to-client streaming (simpler, HTTP-based)
- **WebSockets**: Use for bidirectional real-time communication
- **Managed services** (Pusher, Ably, Supabase): Use for scalability when appropriate

## Server-Sent Events (SSE)

### Route Handler Pattern
```typescript
// app/api/events/route.ts
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial data
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
      
      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 30000);
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Client Usage
```typescript
'use client';
import { useEffect, useState } from 'react';

function useSSE<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(url);
    
    eventSource.onopen = () => setIsConnected(true);
    eventSource.onmessage = (event) => setData(JSON.parse(event.data));
    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [url]);

  return { data, isConnected };
}
```

## WebSocket Implementation

### With Socket.io
```typescript
// server.js (custom server)
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join-room', (roomId) => socket.join(roomId));
    socket.on('message', (data) => io.to(data.room).emit('message', data));
    socket.on('disconnect', () => console.log('Client disconnected'));
  });

  server.listen(3000);
});
```

## Performance & Scaling

1. **Connection pooling** - Reuse connections
2. **Message batching** - Group updates together  
3. **Redis pub/sub** - For horizontal scaling
4. **Sticky sessions** - Route same user to same server
5. **Payload optimization** - Compress, minimize data

## Error Handling & Reliability

1. **Exponential backoff** for reconnection attempts
2. **Queue messages** during disconnection
3. **Show connection status** to users
4. **Graceful degradation** when real-time unavailable

```typescript
// Exponential backoff reconnection
function reconnect(attempt = 1) {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  setTimeout(() => connect(), delay);
}
```

## Security Checklist

- [ ] Authenticate all WebSocket/SSE connections
- [ ] Validate all incoming messages server-side
- [ ] Use private channels for sensitive data
- [ ] Implement rate limiting
- [ ] Encrypt sensitive payloads
- [ ] Validate message origin

## Common Real-time Features

### Live Updates
- Optimistic UI updates
- Conflict resolution for concurrent edits
- Sync state across clients

### Presence
- Track online users
- Show "who's viewing" indicators
- Handle user joins/leaves

### Notifications
- Real-time toast/banner notifications
- Notification center with history
- Handle browser notification permissions

### Collaborative Features
- Show cursor positions
- Use CRDTs for conflict-free updates
- Handle concurrent edits

## Best Practices

1. Choose right technology for use case (SSE vs WebSocket)
2. Always implement proper cleanup (`useEffect` return)
3. Use TypeScript for type safety
4. Test real-time features thoroughly
5. Monitor connection health
6. Document real-time architecture
