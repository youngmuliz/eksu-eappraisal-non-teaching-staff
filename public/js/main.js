// Main JavaScript functions for E-Appraisal System with Enhanced Staff Assessment Views

// Utility functions
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        if (alertDiv) {
            alertDiv.remove();
        }
    }, 5000);
}

function showSpinner(button) {
    const originalText = button.innerHTML;
    button.innerHTML = `<span class="spinner"></span> Loading...`;
    button.disabled = true;
    
    return () => {
        button.innerHTML = originalText;
        button.disabled = false;
    };
}

// Login functionality
function handleLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const hideSpinner = showSpinner(submitBtn);
        
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role')
        };
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.location.href = result.redirect;
            } else {
                showAlert(result.message, 'danger');
            }
        } catch (error) {
            showAlert('Login failed. Please try again.', 'danger');
        } finally {
            hideSpinner();
        }
    });
}

// Registration functionality
function handleRegister() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    const roleSelect = document.getElementById('role');
    const staffIdContainer = document.getElementById('staffIdContainer');
    const staffIdInput = document.getElementById('staffId');

    if (roleSelect && staffIdContainer && staffIdInput) {
        roleSelect.addEventListener('change', (e) => {
            if (e.target.value === 'hod' || e.target.value === 'committee' || e.target.value === 'faculty') {
                staffIdContainer.classList.remove('d-none');
                staffIdInput.required = true;
            } else {
                staffIdContainer.classList.add('d-none');
                staffIdInput.required = false;
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Register form submitted.');

        const submitBtn = form.querySelector('button[type="submit"]');
        const hideSpinner = showSpinner(submitBtn);

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        console.log('Submitting registration data:', data);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            console.log('Server response status:', response.status);
            const result = await response.json();
            console.log('Server response JSON:', result);

            if (result.success) {
                showAlert('Registration successful! Please login.', 'success');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                showAlert(result.message, 'danger');
            }
        } catch (error) {
            console.error('An error occurred during registration:', error);
            showAlert('Registration failed. Please try again.', 'danger');
        } finally {
            console.log('Hiding spinner.');
            hideSpinner();
        }
    });

    // Password toggle functionality
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function () {
            const password = document.getElementById('password');
            const icon = this.querySelector('i');
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            icon.classList.toggle('fa-eye-slash');
        });
    }
}

// Logout functionality
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
        });
        
        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Load user information
async function loadUserInfo() {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            const user = await response.json();
            
            const userNameEl = document.getElementById('userName');
            const userRoleEl = document.getElementById('userRole');
            const userDepartmentEl = document.getElementById('userDepartment');
            const userFacultyEl = document.getElementById('userFaculty');
            const userNameWelcomeEl = document.getElementById('userNameWelcome');
            
            if (userNameEl) userNameEl.textContent = user.name;
            if (userRoleEl) userRoleEl.textContent = user.role.toUpperCase();
            if (userDepartmentEl) userDepartmentEl.textContent = user.department;
            if (userFacultyEl) userFacultyEl.textContent = user.faculty || 'N/A';
            if (userNameWelcomeEl) userNameWelcomeEl.textContent = user.name || 'Faculty Review Panel';
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Staff appraisal form submission
function handleStaffAppraisal() {
    const form = document.getElementById('staffAppraisalForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const hideSpinner = showSpinner(submitBtn);
        
        const formData = new FormData(form);

        try {
            const response = await fetch('/api/staff/appraisal', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('Appraisal submitted successfully!', 'success');
                form.reset();
                setTimeout(() => {
                    window.location.href = '/staff-dashboard.html';
                }, 2000);
            } else {
                showAlert(result.message, 'danger');
            }
        } catch (error) {
            showAlert('Submission failed. Please try again.', 'danger');
        } finally {
            hideSpinner();
        }
    });
}

// Load staff appraisals
async function loadStaffAppraisals() {
    const container = document.getElementById('staffAppraisals');
    if (!container) return;
    
    try {
        console.log('Loading staff appraisals...');
        const response = await fetch('/api/staff/appraisals');
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        // Check if response is ok (status 200-299)
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Received result:', result);
        
        // Check if result is an error object
        // Result can be an array of appraisals or an object like { success: false, appraisals: [] }
        const appraisals = Array.isArray(result) ? result : (result.appraisals || []);
        console.log('Number of appraisals:', appraisals.length);
        
        container.innerHTML = '';

        if (appraisals.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">You have no submitted appraisals yet.</p>
                    <button class="btn btn-primary" onclick="window.location.href='/staff-form.html'">
                        <i class="fas fa-plus me-2"></i>Create Your First Appraisal
                    </button>
                </div>
            `;
            return;
        }

        appraisals.forEach(appraisal => {
            console.log('Generating card for appraisal:', appraisal._id, 'Status:', appraisal.status);
            const card = generateAppraisalCard(appraisal);
            container.appendChild(card);
        });
        
        console.log('Successfully loaded', appraisals.length, 'appraisals');
    } catch (error) {
        console.error('Error loading staff appraisals:', error);
        container.innerHTML = ''; 
    }
}

function generateAppraisalCard(appraisal) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 mb-4';

    let statusBadge, actionButton = '';

    // Ensure appraisal.status is not null or undefined
    const status = appraisal.status || 'unknown';

    switch (status) {
        case 'submitted_by_staff':
            statusBadge = `<span class="badge bg-info text-dark">Pending HOD Evaluation</span>`;
            break;
        case 'evaluated_by_hod':
            statusBadge = `<span class="badge bg-warning text-dark">Evaluation Ready for Your Review</span>`;
            actionButton = `<button class="btn btn-primary btn-sm w-100 mt-3" onclick="viewHodEvaluation('${appraisal._id}')">View Evaluation</button>`;
            break;
        case 'pending_committee_review':
            statusBadge = `<span class="badge bg-success">Accepted - Pending Committee Review</span>`;
            break;
        case 'pending_faculty_panel':
            statusBadge = `<span class="badge bg-primary">Committee Reviewed - Pending Faculty Review</span>`;
            actionButton = `<button class="btn btn-info btn-sm w-100 mt-3" onclick="viewHodEvaluation('${appraisal._id}')">View Evaluation</button>`;
            break;
        case 'rejected_by_staff':
            // Corrected status for rejected appraisals to be more descriptive
            statusBadge = `<span class="badge bg-danger">Rejected. Awaiting HOD Resubmission</span>`;
            break;
        case 'reviewed_by_committee':
            statusBadge = `<span class="badge bg-primary">Completed</span>`;
            break;
        default:
            statusBadge = `<span class="badge bg-secondary">${status.replace(/_/g, ' ')}</span>`;
    }

    // Validate and format dates
    const createdAtDate = appraisal.createdAt ? new Date(appraisal.createdAt) : null;
    const year = createdAtDate && !isNaN(createdAtDate) ? createdAtDate.getFullYear() : 'N/A';
    const submittedDate = createdAtDate && !isNaN(createdAtDate) ? createdAtDate.toLocaleDateString() : 'Invalid Date';

    card.innerHTML = `
        <div class="card h-100 appraisal-card shadow-sm">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">Appraisal - ${year}</h5>
                <p class="card-text text-muted small mb-2">Submitted: ${submittedDate}</p>
                <div class="mt-auto">
                    <div class="mb-2">Status: ${statusBadge}</div>
                    ${actionButton}
                </div>
            </div>
        </div>`;

    return card;
}

async function viewHodEvaluation(appraisalId) {
    try {
        const response = await fetch(`/api/staff/appraisals/${appraisalId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch evaluation details.');
        }
        const appraisal = await response.json();

        const content = document.getElementById('hodEvaluationContent');
        const footer = document.getElementById('hodEvaluationFooter');
        const modalTitle = document.getElementById('hodEvaluationModalLabel');

        const hodEvaluation = appraisal.hodEvaluation || {};
        const committeeReview = appraisal.committeeReview || {};
        const hasHodEvaluation = hodEvaluation && Object.keys(hodEvaluation).length > 0;
        const hasCommitteeReview = committeeReview && Object.keys(committeeReview).length > 0;

        if (!hasHodEvaluation && !hasCommitteeReview) {
            content.innerHTML = '<p class="text-danger">No evaluation details are available at this time.</p>';
            footer.innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>';
            if (modalTitle) modalTitle.textContent = 'Evaluation Details';
        } else {
            let evaluationHTML = '';

            // HOD Evaluation Section
            if (hasHodEvaluation) {
                evaluationHTML += '<div class="mb-4"><h4 class="text-primary">HOD Evaluation Summary</h4>';
                
                // Define the order and labels for HOD evaluation fields
                const hodFields = {
                    evaluatedBy: 'Evaluated By',
                    evaluatedAt: 'Evaluated At',
                    totalScore: 'Total Score',
                    recommendation: 'Recommendation',
                    comments: 'Comments',
                    performanceComments: 'Performance Comments',
                    developmentPlan: 'Development Plan',
                    overallPerformance: 'Overall Performance'
                };

                for (const [key, title] of Object.entries(hodFields)) {
                    let value = hodEvaluation[key];
                    if (key === 'evaluatedAt' && value) {
                        value = new Date(value).toLocaleString();
                    } else if (key === 'totalScore' && value !== undefined) {
                        value = value + '%';
                    } else if (!value) {
                        value = 'N/A';
                    }
                    evaluationHTML += `<p><strong>${title}:</strong> ${value}</p>`;
                }
                evaluationHTML += '</div>';
            } else {
                evaluationHTML += '<div class="mb-4"><h4 class="text-primary">HOD Evaluation</h4><p class="text-muted">HOD evaluation is not available.</p></div>';
            }

            // Committee Review Section
            if (hasCommitteeReview) {
                evaluationHTML += '<div class="mb-4 border-top pt-3"><h4 class="text-success">Committee Review Summary</h4>';
                
                // Define the order and labels for Committee review fields
                const committeeFields = {
                    reviewedBy: 'Reviewed By',
                    reviewedAt: 'Reviewed At',
                    recommendation: 'Recommendation',
                    comments: 'Comments',
                    finalScore: 'Final Score',
                    decision: 'Decision'
                };

                for (const [key, title] of Object.entries(committeeFields)) {
                    let value = committeeReview[key];
                    if (key === 'reviewedAt' && value) {
                        value = new Date(value).toLocaleString();
                    } else if ((key === 'finalScore' || key === 'score') && value !== undefined) {
                        value = value + '%';
                    } else if (!value) {
                        value = 'N/A';
                    }
                    evaluationHTML += `<p><strong>${title}:</strong> ${value}</p>`;
                }
                evaluationHTML += '</div>';
            } else {
                evaluationHTML += '<div class="mb-4 border-top pt-3"><h4 class="text-success">Committee Review</h4><p class="text-muted">Committee review is not available.</p></div>';
            }

            content.innerHTML = evaluationHTML;

            // Update modal title
            if (modalTitle) {
                if (hasHodEvaluation && hasCommitteeReview) {
                    modalTitle.textContent = 'HOD & Committee Evaluation Details';
                } else if (hasHodEvaluation) {
                    modalTitle.textContent = 'HOD Evaluation Details';
                } else if (hasCommitteeReview) {
                    modalTitle.textContent = 'Committee Evaluation Details';
                }
            }

            // Add action buttons - only show Accept/Reject if HOD evaluation exists and status allows
            if (hasHodEvaluation && appraisal.status === 'evaluated_by_hod') {
                footer.innerHTML = `
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-danger" onclick="rejectEvaluation('${appraisalId}')">Reject</button>
                    <button type="button" class="btn btn-success" onclick="acceptEvaluation('${appraisalId}')">Accept</button>
                `;
            } else {
                footer.innerHTML = `
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                `;
            }
        }

        const modal = new bootstrap.Modal(document.getElementById('hodEvaluationModal'));
        modal.show();
    } catch (error) {
        console.error('Error viewing evaluation:', error);
        alert('Error loading evaluation details. Please try again.');
    }
}

async function acceptEvaluation(appraisalId) {
    if (!confirm('Are you sure you want to accept this evaluation?')) return;

    try {
        const response = await fetch(`/api/staff/appraisals/${appraisalId}/accept`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to accept evaluation.');
        }

        const result = await response.json();
        if (result.success) {
            alert(result.message || 'Evaluation accepted successfully!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('hodEvaluationModal'));
            modal.hide();
            loadStaffAppraisals();
        } else {
            throw new Error(result.message || 'Unknown error occurred.');
        }
    } catch (error) {
        console.error('Error accepting evaluation:', error);
        alert(`Error: ${error.message}`);
    }
}

function rejectEvaluation(appraisalId) {
    const hodModal = bootstrap.Modal.getInstance(document.getElementById('hodEvaluationModal'));
    if (hodModal) {
        hodModal.hide();
    }

    document.getElementById('rejectionAppraisalId').value = appraisalId;
    const rejectionModal = new bootstrap.Modal(document.getElementById('rejectionReasonModal'));
    rejectionModal.show();
}

async function submitRejection() {
    const appraisalId = document.getElementById('rejectionAppraisalId').value;
    const comments = document.getElementById('rejectionComments').value;

    if (!comments.trim()) {
        alert('Please provide a reason for rejection.');
        return;
    }

    try {
        const response = await fetch(`/api/staff/appraisals/${appraisalId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comments }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit rejection.');
        }

        const result = await response.json();
        if (result.success) {
            alert('Rejection submitted successfully.');
            const modal = bootstrap.Modal.getInstance(document.getElementById('rejectionReasonModal'));
            modal.hide();
            loadStaffAppraisals();
        } else {
            throw new Error(result.message || 'Unknown error occurred.');
        }
    } catch (error) {
        console.error('Error submitting rejection:', error);
        alert(`Error: ${error.message}`);
    }
}

// Enhanced HOD appraisal loading with complete staff assessment view
async function loadHODAppraisals() {
    const container = document.getElementById('hodAppraisals');
    if (!container) return;
    
    try {
        const response = await fetch('/api/hod/appraisals');
        const appraisals = await response.json();
        
        if (appraisals.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No appraisals pending evaluation.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = appraisals.map(appraisal => {
            return `
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${appraisal.staffName}</h5>
                        <span class="badge bg-${getStatusColor(appraisal.status)}">${formatStatus(appraisal.status)}</span>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-6">
                                <small class="text-muted">Department</small>
                                <p class="mb-0 fw-semibold">${appraisal.department}</p>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Submitted</small>
                                <p class="mb-0 fw-semibold">${new Date(appraisal.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        ${appraisal.data.personalInfo.employeeName ? `
                        <div class="row mb-3">
                            <div class="col-6">
                                <small class="text-muted">Employee Name</small>
                                <p class="mb-0">${appraisal.data.personalInfo.employeeName}</p>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Current Grade</small>
                                <p class="mb-0">${appraisal.data.employmentDetails.currentGrade || 'N/A'}</p>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="mb-3">
                            <small class="text-muted">Present Status</small>
                            <p class="mb-0">${appraisal.data.employmentDetails.presentStatus || 'N/A'}</p>
                        </div>
                        
                        ${appraisal.supportingDocuments && appraisal.supportingDocuments.length > 0 ? 
                            `<div class="mb-3">
                                <small class="text-muted">Supporting Document</small>
                                <p class="mb-0">
                                    <a href="/uploads/${appraisal.supportingDocuments[0]}" class="btn btn-sm btn-outline-info" target="_blank">
                                        <i class="fas fa-download"></i> View Document
                                    </a>
                                </p>
                            </div>` : ''
                        }
                    </div>
                    <div class="card-footer">
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary btn-sm flex-fill" onclick="viewCompleteAssessment('${appraisal._id}')">
                                <i class="fas fa-eye me-1"></i>View Complete Details
                            </button>
                            <button class="btn btn-success btn-sm" onclick="goToEvaluation('${appraisal._id}')">
                                <i class="fas fa-edit me-1"></i>Evaluate
                            </button>
                            ${appraisal.staffId && appraisal.staffCategory ? 
                                `<button class="btn btn-info btn-sm" onclick="evaluatePersonalityTraits('${appraisal.staffId._id}', '${appraisal.staffCategory}')">
                                    <i class="fas fa-brain me-1"></i>Personality Traits
                                </button>` : ''
                            }
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('Error loading HOD appraisals:', error);
        container.innerHTML = '<div class="col-12"><div class="alert alert-danger">Error loading appraisals for HOD view.</div></div>';
    }
}

// Enhanced committee appraisal loading with complete staff assessment view
async function loadCommitteeAppraisals() {
    const container = document.getElementById('committeeAppraisals');
    if (!container) {
        console.error("Container #committeeAppraisals not found.");
        return;
    }

    console.log('Starting loadCommitteeAppraisals (v3)...'); // Version marker

    try {
        const response = await fetch('/api/committee/appraisals');
        console.log('API response received.');
        const appraisals = await response.json();
        console.log('Fetched appraisals data:', appraisals);

        container.innerHTML = ''; // Clear previous content

        if (!appraisals || appraisals.length === 0) {
            console.log('No appraisals found.');
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No appraisals pending committee review.</p>
                </div>
            `;
            return;
        }

        appraisals.forEach((appraisal, index) => {
            console.log(`[Index ${index}] Processing appraisal:`, appraisal);

            if (!appraisal || !appraisal._id) {
                console.error(`[Index ${index}] CRITICAL: Appraisal is missing or has no _id. Skipping.`, appraisal);
                return; // Skip this iteration
            }

            const appraisalId = appraisal._id;
            console.log(`[Index ${index}] Valid appraisalId found: ${appraisalId}`);

            const col = document.createElement('div');
            col.className = 'col-md-6 mb-4';
            
            col.innerHTML = `
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${appraisal.staffName}</h5>
                        <span class="badge bg-${getStatusColor(appraisal.status)}">${formatStatus(appraisal.status)}</span>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-6">
                                <small class="text-muted">Department</small>
                                <p class="mb-0 fw-semibold">${appraisal.department}</p>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">HOD Evaluated</small>
                                <p class="mb-0 fw-semibold">${appraisal.hodEvaluation && appraisal.hodEvaluation.evaluatedAt ? new Date(appraisal.hodEvaluation.evaluatedAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary btn-sm flex-fill js-view-btn">
                                <i class="fas fa-eye me-1"></i>View Details
                            </button>
                            <button class="btn btn-success btn-sm js-review-btn">
                                <i class="fas fa-gavel me-1"></i>Review
                            </button>
                            <button class="btn btn-danger btn-sm js-delete-btn">
                                <i class="fas fa-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(col);

            // Now, find the buttons within the newly added element and attach listeners
            const viewBtn = col.querySelector('.js-view-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', () => viewCompleteAssessment(appraisalId));
            }

            const reviewBtn = col.querySelector('.js-review-btn');
            if (reviewBtn) {
                reviewBtn.addEventListener('click', () => reviewAppraisal(appraisalId));
            }

            const deleteBtn = col.querySelector('.js-delete-btn');
            if (deleteBtn) {
                console.log(`[Index ${index}] Attaching delete listener to button for ID: ${appraisalId}`);
                deleteBtn.addEventListener('click', () => confirmDeleteAppraisal(appraisalId));
            } else {
                 console.error(`[Index ${index}] Could not find delete button to attach listener.`);
            }
        });

    } catch (error) {
        console.error('FATAL ERROR in loadCommitteeAppraisals:', error);
        container.innerHTML = '<div class="col-12"><div class="alert alert-danger">A critical error occurred while loading appraisals. Please check the console.</div></div>';
    }
}

// View complete staff assessment details (for both HOD and Committee)
async function viewCompleteAssessment(assessmentId) {
    const currentPath = window.location.pathname;
    const isCommittee = currentPath.includes('committee');
    const apiEndpoint = isCommittee ? 
        `/api/committee/appraisals/${assessmentId}` : 
        `/api/hod/appraisals/${assessmentId}`;
    
    const modal = new bootstrap.Modal(document.getElementById('staffAssessmentModal'));
    const content = document.getElementById('assessmentContent');
    const actionBtn = document.getElementById(isCommittee ? 'reviewBtn' : 'evaluateBtn');
    
    // Reset content
    content.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted mt-3">Loading staff assessment details...</p>
        </div>
    `;
    
    modal.show();
    
    try {
        const response = await fetch(apiEndpoint);
        if (!response.ok) {
            throw new Error('Failed to fetch assessment details');
        }
        
        const assessment = await response.json();
        
        // Show/hide action button based on status
        if (actionBtn) {
            const shouldShow = isCommittee ? 
                (assessment.status === 'hod_evaluated') : 
                (assessment.status === 'submitted');
            actionBtn.style.display = shouldShow ? 'inline-block' : 'none';
        }
        
        // Store current assessment ID for action buttons
        window.currentAssessmentId = assessmentId;
        
        content.innerHTML = generateCompleteAssessmentHTML(assessment, isCommittee);
        
    } catch (error) {
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error loading assessment details. Please try again.
            </div>
        `;
    }
}

// Generate complete assessment HTML
function generateCompleteAssessmentHTML(assessment, isCommittee = false) {
    const assessmentData = assessment.data || {};
    const personalInfo = assessmentData.personalInfo || {};
    const employmentDetails = assessmentData.employmentDetails || {};
    const academicQualifications = assessmentData.academicQualifications || [];
    const professionalBodies = assessmentData.professionalBodies || [];
    const serviceRecords = assessmentData.serviceRecords || [];
    const trainingRecords = assessmentData.trainingRecords || [];
    const jobDescription = assessmentData.jobDescription || {};
    const supportingDocuments = assessment.supportingDocuments || [];

    return `
        <!-- Staff Overview -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h6 class="mb-0"><i class="fas fa-user me-2"></i>Staff Overview</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Staff Name:</strong> ${assessment.staffName || 'N/A'}</p>
                        <p><strong>Department:</strong> ${assessment.department || 'N/A'}</p>
                        <p><strong>Submission Date:</strong> ${assessment.submittedAt ? new Date(assessment.submittedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Status:</strong> <span class="badge bg-${getStatusColor(assessment.status)}">${formatStatus(assessment.status)}</span></p>
                        <p><strong>Current Grade:</strong> ${employmentDetails.currentGrade || 'N/A'}</p>
                        <p><strong>CONTISS Level:</strong> ${employmentDetails.contissLevel || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Personal Information -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-user-circle me-2"></i>Personal Information</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Full Name:</strong> ${personalInfo.employeeName || 'N/A'}</p>
                        <p><strong>Date of Birth:</strong> ${personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Place of Birth:</strong> ${personalInfo.placeOfBirth || 'N/A'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Marital Status:</strong> ${personalInfo.maritalStatus || 'N/A'}</p>
                        <p><strong>Number of Children:</strong> ${personalInfo.numberOfChildren || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Employment Details -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-briefcase me-2"></i>Employment Details</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Date of First Appointment:</strong> ${employmentDetails.firstAppointment ? new Date(employmentDetails.firstAppointment).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Confirmation Date:</strong> ${employmentDetails.confirmationDate ? new Date(employmentDetails.confirmationDate).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Present Status:</strong> ${employmentDetails.presentStatus || 'N/A'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Nature of Appointment:</strong> ${employmentDetails.appointmentType || 'N/A'}</p>
                        <p><strong>Current Grade Level:</strong> ${employmentDetails.currentGrade || 'N/A'}</p>
                        <p><strong>CONTISS Level:</strong> ${employmentDetails.contissLevel || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Academic Qualifications -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-graduation-cap me-2"></i>Academic Qualifications</h6>
            </div>
            <div class="card-body">
                ${academicQualifications.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Institution</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Qualification</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${academicQualifications.map(qual => `
                                    <tr>
                                        <td>${qual.institution || 'N/A'}</td>
                                        <td>${qual.fromYear || 'N/A'}</td>
                                        <td>${qual.toYear || 'N/A'}</td>
                                        <td>${qual.qualification || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">No academic qualifications recorded.</p>'}
            </div>
        </div>

        <!-- Professional Bodies -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-certificate me-2"></i>Professional Bodies</h6>
            </div>
            <div class="card-body">
                ${professionalBodies.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Professional Body</th>
                                    <th>Membership Date</th>
                                    <th>Membership Number</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${professionalBodies.map(body => `
                                    <tr>
                                        <td>${body.professionalBodyName || 'N/A'}</td>
                                        <td>${body.membershipDate ? new Date(body.membershipDate).toLocaleDateString() : 'N/A'}</td>
                                        <td>${body.membershipNumber || 'N/A'}</td>
                                        <td>${body.membershipStatus || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">No professional bodies recorded.</p>'}
            </div>
        </div>

        <!-- Service Records -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-history me-2"></i>Records of Service</h6>
            </div>
            <div class="card-body">
                ${serviceRecords.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Post/Grade</th>
                                    <th>Supervising Officer</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${serviceRecords.map(record => `
                                    <tr>
                                        <td>${record.serviceDepartment || 'N/A'}</td>
                                        <td>${record.serviceFrom ? new Date(record.serviceFrom).toLocaleDateString() : 'N/A'}</td>
                                        <td>${record.serviceTo ? new Date(record.serviceTo).toLocaleDateString() : 'N/A'}</td>
                                        <td>${record.servicePost || 'N/A'}</td>
                                        <td>${record.supervisingOfficer || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">No service records available.</p>'}
            </div>
        </div>

        <!-- Training Records -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-chalkboard-teacher me-2"></i>Training & Development</h6>
            </div>
            <div class="card-body">
                ${trainingRecords.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Course Title</th>
                                    <th>Institution</th>
                                    <th>Duration</th>
                                    <th>Award</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${trainingRecords.map(training => `
                                    <tr>
                                        <td>${training.trainingDate ? new Date(training.trainingDate).toLocaleDateString() : 'N/A'}</td>
                                        <td>${training.courseTitle || 'N/A'}</td>
                                        <td>${training.trainingInstitution || 'N/A'}</td>
                                        <td>${training.trainingDuration || 'N/A'}</td>
                                        <td>${training.trainingAward || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">No training records available.</p>'}
            </div>
        </div>

        <!-- Job Description & Performance -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-tasks me-2"></i>Job Description & Performance</h6>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <h6>Main Duties:</h6>
                    <p class="text-justify">${jobDescription.jobDescription || 'N/A'}</p>
                </div>
                
                ${jobDescription.difficulties ? `
                <div class="mb-3">
                    <h6>Difficulties Encountered:</h6>
                    <p class="text-justify">${jobDescription.difficulties}</p>
                </div>
                ` : ''}
                
                ${jobDescription.additionalInfo ? `
                <div class="mb-3">
                    <h6>Additional Information:</h6>
                    <p class="text-justify">${jobDescription.additionalInfo}</p>
                </div>
                ` : ''}
                
                ${jobDescription.majorContributions ? `
                <div class="mb-3">
                    <h6>Major Contributions:</h6>
                    <p class="text-justify">${jobDescription.majorContributions}</p>
                </div>
                ` : ''}
                
                ${jobDescription.publications ? `
                <div class="mb-3">
                    <h6>Publications:</h6>
                    <p class="text-justify">${jobDescription.publications}</p>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Supporting Documents -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-paperclip me-2"></i>Supporting Documents</h6>
            </div>
            <div class="card-body">
                ${supportingDocuments.length > 0 ? `
                    <ul class="list-group">
                        ${supportingDocuments.map(doc => `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                <span>
                                    <i class="fas fa-file-alt me-2"></i>
                                    ${typeof doc === 'object' ? doc.filename : doc}
                                </span>
                                <a href="/uploads/${typeof doc === 'object' ? doc.filename : doc}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="fas fa-eye me-1"></i>View
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p class="text-muted">No supporting documents uploaded.</p>'}
            </div>
        </div>

        ${isCommittee ? (() => {
            const hodEvaluation = assessment.hodEvaluation || {};
            const committeeReview = assessment.committeeReview || {};
            const hasHodEvaluation = hodEvaluation && Object.keys(hodEvaluation).length > 0;
            const hasCommitteeReview = committeeReview && Object.keys(committeeReview).length > 0;
            
            let html = '';
            
            // HOD Evaluation Section
            if (hasHodEvaluation) {
                html += `
                <!-- HOD Evaluation -->
                <div class="card mb-4">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="fas fa-check-circle me-2"></i>HOD Evaluation</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Evaluated by:</strong> ${hodEvaluation.evaluatedBy || 'N/A'}</p>
                                <p><strong>Evaluation Date:</strong> ${hodEvaluation.evaluatedAt ? new Date(hodEvaluation.evaluatedAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Total Score:</strong> ${hodEvaluation.totalScore !== undefined ? hodEvaluation.totalScore + '%' : 'N/A'}</p>
                                <p><strong>Recommendation:</strong> ${hodEvaluation.recommendation || 'N/A'}</p>
                            </div>
                        </div>
                        ${hodEvaluation.comments ? `
                        <div class="mt-3">
                            <h6>HOD Comments:</h6>
                            <p class="text-justify">${hodEvaluation.comments}</p>
                        </div>
                        ` : ''}
                        ${hodEvaluation.performanceComments ? `
                        <div class="mt-3">
                            <h6>Performance Comments:</h6>
                            <p class="text-justify">${hodEvaluation.performanceComments}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
                `;
            }
            
            // Committee Review Section
            if (hasCommitteeReview) {
                html += `
                <!-- Committee Review -->
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0"><i class="fas fa-gavel me-2"></i>Committee Review</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Reviewed by:</strong> ${committeeReview.reviewedBy || 'N/A'}</p>
                                <p><strong>Review Date:</strong> ${committeeReview.reviewedAt ? new Date(committeeReview.reviewedAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Recommendation:</strong> ${committeeReview.recommendation || 'N/A'}</p>
                                ${committeeReview.score !== undefined ? `
                                <p><strong>Score:</strong> ${committeeReview.score}%</p>
                                ` : ''}
                            </div>
                        </div>
                        ${committeeReview.comments ? `
                        <div class="mt-3">
                            <h6>Committee Comments:</h6>
                            <p class="text-justify">${committeeReview.comments}</p>
                        </div>
                        ` : ''}
                        ${committeeReview.remarks ? `
                        <div class="mt-3">
                            <h6>Remarks:</h6>
                            <p class="text-justify">${committeeReview.remarks}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
                `;
            }
            
            return html;
        })() : ''}
    `;
}

// Helper functions for recommendations and status
function getRecommendationColor(recommendation) {
    const colors = {
        'promotion': 'success',
        'confirmation': 'success',
        'commendation': 'info',
        'normal_increment': 'primary',
        'training': 'warning',
        'warning': 'warning',
        'sanction': 'danger',
        'deferred_increment': 'warning',
        'withholding_increment': 'danger',
        'termination': 'danger',
        'dismissal': 'danger'
    };
    return colors[recommendation] || 'secondary';
}

function formatRecommendation(recommendation) {
    if (!recommendation) return 'N/A';
    return recommendation.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Helper functions
function getStatusColor(status) {
    const colors = {
        'submitted': 'info',
        'submitted_by_staff': 'info',
        'evaluated_by_hod': 'warning',
        'hod_evaluated': 'warning',
        'pending_committee_review': 'warning',
        'accepted_by_staff': 'success',
        'pending_faculty_panel': 'primary',
        'pending_faculty_review': 'primary',
        'reviewed_by_committee': 'success',
        'completed': 'success'
    };
    return colors[status] || 'secondary';
}

function formatStatus(status) {
    const formats = {
        'submitted': 'Pending HOD Review',
        'submitted_by_staff': 'Pending HOD Review',
        'evaluated_by_hod': 'Awaiting Staff Review',
        'hod_evaluated': 'Pending Committee Review',
        'pending_committee_review': 'Pending Committee Review',
        'accepted_by_staff': 'Accepted by Staff',
        'pending_faculty_panel': 'Pending Faculty Review',
        'pending_faculty_review': 'Pending Faculty Review',
        'reviewed_by_committee': 'Committee Reviewed',
        'completed': 'Completed'
    };
    return formats[status] || status;
}

// Navigation functions
function viewAppraisal(id) {
    window.location.href = `/hod-evaluation.html?id=${id}`;
}

function viewFullAppraisal(id) {
    window.location.href = `/committee-review.html?id=${id}`;
}

function evaluateAppraisal(id) {
    window.location.href = `/hod-evaluation.html?id=${id}`;
}

function reviewAppraisal(id) {
    window.location.href = `/committee-review.html?id=${id}`;
}

// Navigate to Personality Traits evaluation (HOD)
window.evaluatePersonalityTraits = function(staffId, staffCategory) {
    if (!staffId || !staffCategory) {
        console.error('staffId and staffCategory are required for evaluation');
        showAlert('Cannot proceed with evaluation due to missing staff information.', 'danger');
        return;
    }

    // Determine staff type (e.g., 'senior' or 'junior')
    const staffType = staffCategory.toLowerCase().includes('senior') ? 'senior' : 'junior';

    // Navigate to the dynamic personality traits page
    window.location.href = `/hod-personality-traits-dynamic.html?staffId=${staffId}&staffType=${staffType}`;
}

// Export generateCompleteAssessmentHTML to global scope
window.generateCompleteAssessmentHTML = generateCompleteAssessmentHTML;

// Modal action functions
function goToEvaluation(staffId) {
    // If staffId is provided, use it, otherwise use the one from window.currentAssessmentId
    const targetId = staffId || window.currentAssessmentId;
    if (targetId) {
        window.location.href = `/hod-evaluation.html?id=${targetId}`;
    } else {
        console.error('No staff ID provided for evaluation');
        alert('Error: Could not determine which staff to evaluate. Please try again.');
    }
}

function goToReview() {
    if (window.currentAssessmentId) {
        window.location.href = `/committee-review.html?id=${window.currentAssessmentId}`;
    }
}

// Password visibility toggle
function togglePasswordVisibility() {
    const toggleBtn = document.getElementById('togglePasswordBtn');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        const passwordInput = document.getElementById('password');
        const icon = document.getElementById('toggleIcon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
}

// HOD Evaluation Page Logic
async function loadHodEvaluationData(appraisalId) {
    try {
        const response = await fetch(`/api/hod/appraisals/${appraisalId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch appraisal data.');
        }
        const appraisal = await response.json();

        document.getElementById('staffName').textContent = appraisal.staffName;
        document.getElementById('department').textContent = appraisal.department;
        document.getElementById('submissionDate').textContent = new Date(appraisal.submittedAt).toLocaleDateString();

        // Populate staff self-assessment section
        const staffFormDataContainer = document.querySelector('#staffFormData .border');
        if (staffFormDataContainer) {
            staffFormDataContainer.innerHTML = generateCompleteAssessmentHTML(appraisal, false);
        }

    } catch (error) {
        console.error('Error loading evaluation data:', error);
        showAlert('Could not load appraisal data. Please go back and try again.', 'danger');
    }
}

function updateHodScore() {
    const selects = document.querySelectorAll('select[name^="item_"]');
    let totalScore = 0;
    let selectedCount = 0;

    selects.forEach(select => {
        if (select.value !== '') {
            totalScore += parseInt(select.value);
            selectedCount++;
        }
    });

    const maxPossibleScore = selects.length * 5;
    const percentage = selectedCount > 0 ? Math.round((totalScore / (selectedCount * 5)) * 100) : 0;

    document.getElementById('totalScore').textContent = `${totalScore} / ${maxPossibleScore}`;
    document.getElementById('percentageScore').textContent = `${percentage}%`;

    let gradeText = 'No Grade';
    let overallRating = '';

    if (percentage >= 80) {
        gradeText = 'Outstanding';
        overallRating = 'outstanding';
    } else if (percentage >= 70) {
        gradeText = 'Very Good';
        overallRating = 'very_good';
    } else if (percentage >= 60) {
        gradeText = 'Good';
        overallRating = 'good';
    } else if (percentage >= 50) {
        gradeText = 'Fair';
        overallRating = 'fair';
    } else if (selectedCount > 0) {
        gradeText = 'Unsatisfactory';
        overallRating = 'unsatisfactory';
    }

    document.getElementById('gradeText').textContent = gradeText;

    if (overallRating && selectedCount === selects.length) {
        document.getElementById('overallPerformance').value = overallRating;
    }
}

function handleHodEvaluationSubmission() {
    const form = document.getElementById('hodEvaluationForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const appraisalId = new URLSearchParams(window.location.search).get('id');
        if (!appraisalId) {
            return showAlert('Error: Could not find Appraisal ID.', 'danger');
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const hideSpinner = showSpinner(submitBtn);

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`/api/hod/appraisals/${appraisalId}/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                showAlert('Evaluation submitted successfully!', 'success');
                setTimeout(() => window.location.href = '/hod-dashboard.html', 1500);
            } else {
                showAlert(result.message || 'Error submitting evaluation.', 'danger');
            }
        } catch (error) {
            console.error('Submission error:', error);
            showAlert('An error occurred while submitting the evaluation.', 'danger');
        } finally {
            hideSpinner();
        }
    });
}

function initHodEvaluationPage() {
    const appraisalId = new URLSearchParams(window.location.search).get('id');
    if (!appraisalId) {
        showAlert('No appraisal ID found. Please return to the dashboard.', 'danger');
        return;
    }

    loadHodEvaluationData(appraisalId);

    const selects = document.querySelectorAll('select[name^="item_"]');
    selects.forEach(select => {
        select.addEventListener('change', updateHodScore);
    });

    updateHodScore(); // Initial calculation
    handleHodEvaluationSubmission();
}

// HOD Evaluation form submission
async function handleHodEvaluation() {
    const form = document.getElementById('hodEvaluationForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const urlParams = new URLSearchParams(window.location.search);
        const appraisalId = urlParams.get('id');
        const staffId = form.dataset.staffId; // Assuming staffId is stored in a data attribute

        const submitBtn = form.querySelector('button[type="submit"]');
        const hideSpinner = showSpinner(submitBtn);

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`/api/hod/appraisals/${appraisalId}/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                showAlert('Evaluation submitted successfully! Redirecting to personality traits evaluation...', 'success');
                
                // Get staff category and redirect
                const category = await getStaffCategory(staffId);
                const staffType = (category === 'senior') ? 'senior' : 'junior';

                setTimeout(() => {
                    window.location.href = `/hod-personality-traits-dynamic.html?staffId=${staffId}&staffType=${staffType}`;
                }, 2000);
            } else {
                showAlert(result.message, 'danger');
            }
        } catch (error) {
            showAlert('Submission failed. Please try again.', 'danger');
        } finally {
            hideSpinner();
        }
    });
}

async function getStaffCategory(staffId) {
    try {
        const response = await fetch(`/api/hod/staff/${staffId}/category`);
        if (response.ok) {
            const data = await response.json();
            return data.category;
        }
        return 'junior'; // Default to junior if fetch fails
    } catch (error) {
        console.error('Error fetching staff category:', error);
        return 'junior'; // Default to junior on error
    }
}

// Delete Appraisal
function confirmDeleteAppraisal(appraisalId) {
    console.log('confirmDeleteAppraisal called with ID:', appraisalId);

    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    if (!appraisalId) {
        console.error('CRITICAL: appraisalId is undefined or null when calling confirmDeleteAppraisal.');
        showAlert('Cannot delete: Appraisal ID is missing.', 'danger');
        return;
    }

    // Use a clone to remove previous event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
        console.log('Confirm delete button clicked for appraisalId:', appraisalId);
        deleteAppraisal(appraisalId);
        deleteModal.hide();
    });

    console.log('Showing delete confirmation modal.');
    deleteModal.show();
}

async function deleteAppraisal(appraisalId) {
    console.log('deleteAppraisal function started for ID:', appraisalId);
    if (!appraisalId) {
        console.error('CRITICAL: deleteAppraisal called with an undefined or null appraisalId.');
        showAlert('Deletion failed: Appraisal ID is missing.', 'danger');
        return;
    }

    const apiUrl = `/api/committee/appraisals/${appraisalId}`;
    console.log('Sending DELETE request to:', apiUrl);

    try {
        const response = await fetch(apiUrl, {
            method: 'DELETE',
        });

        console.log('Received response from server with status:', response.status);
        const result = await response.json();
        console.log('Server response body:', result);

        if (result.success) {
            showAlert('Appraisal deleted successfully!', 'success');
            console.log('Reloading committee appraisals...');
            loadCommitteeAppraisals(); // Refresh the list
        } else {
            showAlert(result.message, 'danger');
            console.error('Server returned an error:', result.message);
        }
    } catch (error) {
        showAlert('Deletion failed. Please check the console for details.', 'danger');
        console.error('An error occurred during the fetch operation:', error);
    }
}

// Main DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    handleLogin();
    handleRegister();
    handleStaffAppraisal();
    handleHodEvaluation();

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    if (document.getElementById('staffAppraisals')) {
        loadStaffAppraisals();
    }

    if (document.getElementById('hodAppraisals')) {
        loadHODAppraisals();
    }

    if (document.getElementById('committeeAppraisals')) {
        loadCommitteeAppraisals();
    }

    if (window.location.pathname.endsWith('staff-dashboard.html') || 
        window.location.pathname.endsWith('hod-dashboard.html') || 
        window.location.pathname.endsWith('committee-dashboard.html') ||
        window.location.pathname.endsWith('faculty-dashboard.html')) {
        loadUserInfo();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('staff-dashboard.html')) {
        loadStaffAppraisals();
    }
});