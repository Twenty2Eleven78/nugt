import { authService } from './modules/services/auth.js';
import { userMatchesApi } from './modules/services/user-matches-api.js';

document.addEventListener('DOMContentLoaded', async () => {
    await authService.init();
    const user = authService.getCurrentUser();
    if (!user || !authService.isAdmin()) {
        window.location.href = 'index.html';
        return;
    }

    const tableBody = document.getElementById('matches-table-body');
    if (!tableBody) return;

    try {
        const matches = await userMatchesApi.loadAllMatchData();
        if (matches && matches.length > 0) {
            matches.forEach(match => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${match.userId}</td>
                    <td>${match.title}</td>
                    <td>${new Date(match.savedAt).toLocaleString()}</td>
                    <td><button class="btn btn-sm btn-primary">View</button></td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="4">No matches found.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        tableBody.innerHTML = '<tr><td colspan="4">Error loading matches.</td></tr>';
    }
});
