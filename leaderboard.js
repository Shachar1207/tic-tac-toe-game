// This file runs only on the leaderboard page (leaderboard.html).
// Its only job is to ask the server for the leaderboard data and display it.

// Same server URL as in script.js - must match exactly
const SERVER_URL = 'https://tic-tac-toe-server-3mou.onrender.com';

// This runs automatically as soon as the page loads
window.onload = loadLeaderboard;

async function loadLeaderboard() {
    const listEl = document.getElementById('leaderboardList');

    try {
        // Send a GET request to the server asking for leaderboard data
        const response = await fetch(`${SERVER_URL}/leaderboard`);
        const data = await response.json(); // Parse the JSON the server sends back

        if (data.length === 0) {
            // No scores yet
            listEl.innerHTML = '<p class="no-scores">No scores yet. Play a game to get on the board!</p>';
            return;
        }

        // Build an HTML table to display the scores
        // data is an array like: [{ username: "Shachar", wins: 5 }, { username: "Dana", wins: 3 }]
        let tableHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Wins</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Loop through each player and create a table row
        data.forEach((player, index) => {
            const rank = index + 1; // index starts at 0, so rank 1 = index 0

            // Give the first place player a special CSS class
            const rowClass = rank === 1 ? 'first-place' : '';

            // Choose a medal emoji for top 3
            let rankDisplay;
            if (rank === 1) rankDisplay = '🥇';
            else if (rank === 2) rankDisplay = '🥈';
            else if (rank === 3) rankDisplay = '🥉';
            else rankDisplay = rank;

            tableHTML += `
                <tr class="${rowClass}">
                    <td class="rank">${rankDisplay}</td>
                    <td>${player.username}</td>
                    <td>${player.wins} win${player.wins !== 1 ? 's' : ''}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        listEl.innerHTML = tableHTML;

    } catch (error) {
        // If the server is unreachable, show an error message
        console.error('Could not load leaderboard:', error);
        listEl.innerHTML = '<p class="no-scores">Could not connect to server. Please try again later.</p>';
    }
}