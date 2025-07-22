import { userMatchesApi } from '../services/user-matches-api.js';

const modalHtml = `
<div class="modal fade" id="admin-modal" tabindex="-1" aria-labelledby="admin-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="admin-modal-label">Admin Dashboard</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Match Title</th>
                            <th>Date Saved</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="matches-table-body">
                        <!-- Match data will be inserted here -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
`;

let modalInstance = null;

const init = () => {
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalElement = document.getElementById('admin-modal');
    modalInstance = new bootstrap.Modal(modalElement);

    modalElement.addEventListener('show.bs.modal', async () => {
        const tableBody = document.getElementById('matches-table-body');
        if (!tableBody) return;

        try {
            const matches = await userMatchesApi.loadAllMatchData();
            if (matches && matches.length > 0) {
                tableBody.innerHTML = ''; // Clear existing data
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
};

const show = () => {
    if (!modalInstance) {
        init();
    }
    modalInstance.show();
};

export const adminModal = {
    init,
    show
};
