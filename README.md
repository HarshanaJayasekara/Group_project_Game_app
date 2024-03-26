```mermaid
flowchart TD
   subgraph System Architecture
        A[Socket.IO] <-->|WebSocket| B{Express Server}
        B <-->|Player 1| C[fa:fa-laptop x86 Windows Device]
        B <-->|Player 2| D[fa:fa-desktop x86 Linux Device]
        B <-->|Player 3| E[fa:fa-mobile ARM Android Device]
        B <-->|Player 4| F[fa:fa-mobile ARM iOS Device]
    end
```
