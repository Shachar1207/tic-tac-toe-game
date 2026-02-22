# Tic Tac Toe - Client

Frontend client for the Tic Tac Toe final project.
Built with HTML, CSS, and JavaScript — deployed as a static site on Render.

## Screens

### Screen 1 – Game (index.html)
- Players enter their usernames before starting
- Classic 3×3 Tic Tac Toe board
- 30-second move timer — time out and you lose!
- Session score tracking (X wins, O wins, draws)
- Winning squares highlight in gold
- Button to navigate to the leaderboard

### Screen 2 – Leaderboard (leaderboard.html)
- Fetches all-time win records from the backend server
- Displays players ranked by total wins
- 🥇🥈🥉 medals for top 3 players

## File Structure

```
index.html       – Game screen HTML structure
leaderboard.html – Leaderboard screen HTML structure
style.css        – All styling for both screens
script.js        – Game logic + server communication for the game screen
leaderboard.js   – Fetches and displays leaderboard data
```

## How it communicates with the server

When a game ends, `script.js` sends a POST request to the backend server:
```javascript
fetch('https://your-server.onrender.com/wins', {
    method: 'POST',
    body: JSON.stringify({ username: 'Shachar' })
})
```

When the leaderboard loads, `leaderboard.js` sends a GET request:
```javascript
fetch('https://your-server.onrender.com/leaderboard')
```

## Technologies Used

- **HTML5** – Page structure
- **CSS3** – Styling, animations, responsive layout
- **JavaScript (ES6)** – Game logic, DOM manipulation, fetch API for server communication

## Deployment

This client is deployed as a **Static Site** on https://tic-tac-toe-client-fpqj.onrender.com/.
Connected to this GitHub repository — every push to `main` triggers an automatic redeploy.

## Project Author

**Shachar Cohen Sharon**
- GitHub: [@Shachar1207](https://github.com/Shachar1207)
- Email: Shachari07sharon@gmail.com
