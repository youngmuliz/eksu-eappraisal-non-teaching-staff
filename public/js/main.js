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
            username: formData.get('username'),
            password: formData.get('password'),
            role: formData.get('role')
        };
        
        try {
            const response = await fetch('/api/login', {
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
        }
        
        hideSpinner();
    });
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
            
            if (userNameEl) userNameEl.textContent = user.name;
            if (userRoleEl) userRoleEl.textContent = user.role.toUpperCase();
            if (userDepartmentEl) userDepartmentEl.textContent = user.department;
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
        }
        
        hideSpinner();
    });
}

// Load staff appraisals
async function loadStaffAppraisals() {
    const container = document.getElementById('staffAppraisals');
    if (!container) return;
    
    try {
        const response = await fetch('/api/staff/appraisals');
        const appraisals = await response.json();
        
        if (appraisals.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No appraisals submitted yet.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = appraisals.map(appraisal => `
            <div class="col-md-6 col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h5>Appraisal #${appraisal.id}</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Department:</strong> ${appraisal.department}</p>
                        <p><strong>Status:</strong> 
                            <span class="badge bg-${getStatusColor(appraisal.status)}">${formatStatus(appraisal.status)}</span>
                        </p>
                        <p><strong>Submitted:</strong> ${new Date(appraisal.submittedAt).toLocaleDateString()}</p>
                        ${appraisal.supportingDocument ? 
                            `<p><strong>Document:</strong> 
                                <a href="/api/download/${appraisal.supportingDocument}" class="btn btn-sm btn-outline-primary">
                                    <i class="fas fa-download"></i> Download
                                </a>
                            </p>` : ''
                        }
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div class="alert alert-danger">Error loading appraisals</div>';
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
        
        container.innerHTML = appraisals.map(appraisal => `
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
                                <p class="mb-0 fw-semibold">${new Date(appraisal.submittedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        ${appraisal.data.employeeName ? `
                        <div class="row mb-3">
                            <div class="col-6">
                                <small class="text-muted">Employee Name</small>
                                <p class="mb-0">${appraisal.data.employeeName}</p>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Current Grade</small>
                                <p class="mb-0">${appraisal.data.currentGrade || 'N/A'}</p>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="mb-3">
                            <small class="text-muted">Present Status</small>
                            <p class="mb-0">${appraisal.data.presentStatus || 'N/A'}</p>
                        </div>
                        
                        ${appraisal.supportingDocument ? 
                            `<div class="mb-3">
                                <small class="text-muted">Supporting Document</small>
                                <p class="mb-0">
                                    <a href="/api/download/${appraisal.supportingDocument}" class="btn btn-sm btn-outline-info">
                                        <i class="fas fa-download"></i> Download
                                    </a>
                                </p>
                            </div>` : ''
                        }
                    </div>
                    <div class="card-footer">
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary btn-sm flex-fill" onclick="viewCompleteAssessment(${appraisal.id})">
                                <i class="fas fa-eye me-1"></i>View Complete Details
                            </button>
                            ${appraisal.status === 'submitted' ? 
                                `<button class="btn btn-success btn-sm" onclick="evaluateAppraisal(${appraisal.id})">
                                    <i class="fas fa-edit me-1"></i>Evaluate
                                </button>` : ''
                            }
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-danger">Error loading appraisals</div></div>';
    }
}

// Enhanced committee appraisal loading with complete staff assessment view
async function loadCommitteeAppraisals() {
    const container = document.getElementById('committeeAppraisals');
    if (!container) return;
    
    try {
        const response = await fetch('/api/committee/appraisals');
        const appraisals = await response.json();
        
        if (appraisals.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No appraisals pending committee review.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = appraisals.map(appraisal => `
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
                                <small class="text-muted">HOD Evaluated</small>
                                <p class="mb-0 fw-semibold">${new Date(appraisal.hodEvaluation.evaluatedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-6">
                                <small class="text-muted">HOD Score</small>
                                <p class="mb-0">${appraisal.hodEvaluation.totalScore || 'N/A'}%</p>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Evaluated By</small>
                                <p class="mb-0">${appraisal.hodEvaluation.evaluatedBy}</p>
                            </div>
                        </div>

                        ${appraisal.data.employeeName ? `
                        <div class="row mb-3">
                            <div class="col-6">
                                <small class="text-muted">Employee Name</small>
                                <p class="mb-0">${appraisal.data.employeeName}</p>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Current Grade</small>
                                <p class="mb-0">${appraisal.data.currentGrade || 'N/A'}</p>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="mb-3">
                            <small class="text-muted">Present Status</small>
                            <p class="mb-0">${appraisal.data.presentStatus || 'N/A'}</p>
                        </div>
                        
                        ${appraisal.hodEvaluation.recommendation ? `
                        <div class="mb-3">
                            <small class="text-muted">HOD Recommendation</small>
                            <p class="mb-0">
                                <span class="badge bg-info">${appraisal.hodEvaluation.recommendation}</span>
                            </p>
                        </div>
                        ` : ''}
                    </div>
                    <div class="card-footer">
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary btn-sm flex-fill" onclick="viewCompleteAssessment(${appraisal.id})">
                                <i class="fas fa-eye me-1"></i>View Complete Details
                            </button>
                            ${appraisal.status === 'hod_evaluated' ? 
                                `<button class="btn btn-success btn-sm" onclick="reviewAppraisal(${appraisal.id})">
                                    <i class="fas fa-gavel me-1"></i>Review
                                </button>` : ''
                            }
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-danger">Error loading appraisals</div></div>';
    }
}

// View complete staff assessment details (for both HOD and Committee)
async function viewCompleteAssessment(assessmentId) {
    const currentPath = window.location.pathname;
    const isCommittee = currentPath.includes('committee');
    const apiEndpoint = isCommittee ? 
        `/api/committee/staff-assessment/${assessmentId}` : 
        `/api/hod/staff-assessment/${assessmentId}`;
    
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
    return `
        <!-- Staff Overview -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h6 class="mb-0"><i class="fas fa-user me-2"></i>Staff Overview</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Staff Name:</strong> ${assessment.staffName}</p>
                        <p><strong>Department:</strong> ${assessment.department}</p>
                        <p><strong>Submission Date:</strong> ${new Date(assessment.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Status:</strong> <span class="badge bg-${getStatusColor(assessment.status)}">${formatStatus(assessment.status)}</span></p>
                        <p><strong>Current Grade:</strong> ${assessment.employmentDetails.currentGrade || 'N/A'}</p>
                        <p><strong>CONTISS Level:</strong> ${assessment.employmentDetails.contissLevel || 'N/A'}</p>
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
                        <p><strong>Full Name:</strong> ${assessment.personalInfo.employeeName || 'N/A'}</p>
                        <p><strong>Date of Birth:</strong> ${assessment.personalInfo.dateOfBirth || 'N/A'}</p>
                        <p><strong>Place of Birth:</strong> ${assessment.personalInfo.placeOfBirth || 'N/A'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Marital Status:</strong> ${assessment.personalInfo.maritalStatus || 'N/A'}</p>
                        <p><strong>Number of Children:</strong> ${assessment.personalInfo.numberOfChildren || 'N/A'}</p>
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
                        <p><strong>Date of First Appointment:</strong> ${assessment.employmentDetails.firstAppointment || 'N/A'}</p>
                        <p><strong>Confirmation Date:</strong> ${assessment.employmentDetails.confirmationDate || 'N/A'}</p>
                        <p><strong>Present Status:</strong> ${assessment.employmentDetails.presentStatus || 'N/A'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Nature of Appointment:</strong> ${assessment.employmentDetails.appointmentType || 'N/A'}</p>
                        <p><strong>Current Grade Level:</strong> ${assessment.employmentDetails.currentGrade || 'N/A'}</p>
                        <p><strong>CONTISS Level:</strong> ${assessment.employmentDetails.contissLevel || 'N/A'}</p>
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
                ${assessment.academicQualifications && assessment.academicQualifications.length > 0 ? `
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
                                ${assessment.academicQualifications.map(qual => `
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
        ${assessment.professionalBodies && assessment.professionalBodies.professionalBody ? `
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-certificate me-2"></i>Professional Bodies</h6>
            </div>
            <div class="card-body">
                <p><strong>Professional Body:</strong> ${assessment.professionalBodies.professionalBody}</p>
                <p><strong>Membership Date:</strong> ${assessment.professionalBodies.membershipDate || 'N/A'}</p>
            </div>
        </div>
        ` : ''}

        <!-- Service Records -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-history me-2"></i>Records of Service</h6>
            </div>
            <div class="card-body">
                ${assessment.serviceRecords && assessment.serviceRecords.length > 0 ? `
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
                                ${assessment.serviceRecords.map(record => `
                                    <tr>
                                        <td>${record.serviceDepartment || 'N/A'}</td>
                                        <td>${record.serviceFrom || 'N/A'}</td>
                                        <td>${record.serviceTo || 'N/A'}</td>
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
                ${assessment.trainingRecords && assessment.trainingRecords.length > 0 ? `
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
                                ${assessment.trainingRecords.map(training => `
                                    <tr>
                                        <td>${training.trainingDate || 'N/A'}</td>
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
                    <p class="text-justify">${assessment.jobDescription.jobDescription || 'N/A'}</p>
                </div>
                
                ${assessment.jobDescription.difficulties ? `
                <div class="mb-3">
                    <h6>Difficulties Encountered:</h6>
                    <p class="text-justify">${assessment.jobDescription.difficulties}</p>
                </div>
                ` : ''}
                
                ${assessment.jobDescription.additionalInfo ? `
                <div class="mb-3">
                    <h6>Additional Information:</h6>
                    <p class="text-justify">${assessment.jobDescription.additionalInfo}</p>
                </div>
                ` : ''}
                
                ${assessment.jobDescription.majorContributions ? `
                <div class="mb-3">
                    <h6>Major Contributions:</h6>
                    <p class="text-justify">${assessment.jobDescription.majorContributions}</p>
                </div>
                ` : ''}
                
                ${assessment.jobDescription.publications ? `
                <div class="mb-3">
                    <h6>Publications:</h6>
                    <p class="text-justify">${assessment.jobDescription.publications}</p>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Supporting Documents -->
        ${assessment.supportingDocument ? `
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-paperclip me-2"></i>Supporting Documents</h6>
            </div>
            <div class="card-body">
                <a href="/api/download/${assessment.supportingDocument}" class="btn btn-outline-primary">
                    <i class="fas fa-download me-2"></i>Download Supporting Document
                </a>
            </div>
        </div>
        ` : ''}

        <!-- HOD Evaluation (if exists) -->
        ${assessment.hodEvaluation ? `
        <div class="card mb-4">
            <div class="card-header bg-success text-white">
                <h6 class="mb-0"><i class="fas fa-check-circle me-2"></i>HOD Evaluation</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Evaluated by:</strong> ${assessment.hodEvaluation.evaluatedBy}</p>
                        <p><strong>Evaluation Date:</strong> ${new Date(assessment.hodEvaluation.evaluatedAt).toLocaleDateString()}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Total Score:</strong> ${assessment.hodEvaluation.totalScore || 'N/A'}%</p>
                        <p><strong>Recommendation:</strong> ${assessment.hodEvaluation.recommendation || 'N/A'}</p>
                    </div>
                </div>
                ${assessment.hodEvaluation.comments ? `
                <div class="mt-3">
                    <h6>HOD Comments:</h6>
                    <p class="text-justify">${assessment.hodEvaluation.comments}</p>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}

        <!-- Committee Review (if exists and viewing from committee) -->
        ${isCommittee && assessment.committeeReview ? `
        <div class="card">
            <div class="card-header bg-warning text-dark">
                <h6 class="mb-0"><i class="fas fa-gavel me-2"></i>Committee Review</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Reviewed by:</strong> ${assessment.committeeReview.reviewedBy}</p>
                        <p><strong>Review Date:</strong> ${new Date(assessment.committeeReview.reviewedAt).toLocaleDateString()}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Final Recommendation:</strong> 
                            <span class="badge bg-${getRecommendationColor(assessment.committeeReview.recommendation)}">
                                ${formatRecommendation(assessment.committeeReview.recommendation)}
                            </span>
                        </p>
                    </div>
                </div>
                ${assessment.committeeReview.comments ? `
                <div class="mt-3">
                    <h6>Committee Comments:</h6>
                    <p class="text-justify">${assessment.committeeReview.comments}</p>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}
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
        'hod_evaluated': 'warning',
        'completed': 'success'
    };
    return colors[status] || 'secondary';
}

function formatStatus(status) {
    const formats = {
        'submitted': 'Pending HOD Review',
        'hod_evaluated': 'Pending Committee Review',
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

// Modal action functions
function goToEvaluation() {
    if (window.currentAssessmentId) {
        window.location.href = `/hod-evaluation.html?id=${window.currentAssessmentId}`;
    }
}

function goToReview() {
    if (window.currentAssessmentId) {
        window.location.href = `/committee-review.html?id=${window.currentAssessmentId}`;
    }
}

// Handle HOD evaluation form
function handleHODEvaluation() {
    const urlParams = new URLSearchParams(window.location.search);
    const appraisalId = urlParams.get('id');
    
    if (!appraisalId) {
        showAlert('Invalid appraisal ID', 'danger');
        return;
    }
    
    loadAppraisalForEvaluation(appraisalId);
    
    const form = document.getElementById('hodEvaluationForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const hideSpinner = showSpinner(submitBtn);
        
        const formData = new FormData(form);
        const evaluationData = {};
        
        for (let [key, value] of formData.entries()) {
            evaluationData[key] = value;
        }
        
        // Calculate total score
        evaluationData.totalScore = calculateScore(formData);
        
        try {
            const response = await fetch(`/api/hod/evaluate/${appraisalId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(evaluationData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('Evaluation completed successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/hod-dashboard.html';
                }, 2000);
            } else {
                showAlert(result.message, 'danger');
            }
        } catch (error) {
            showAlert('Evaluation failed. Please try again.', 'danger');
        }
        
        hideSpinner();
    });
}

// Handle committee review form
function handleCommitteeReview() {
    const urlParams = new URLSearchParams(window.location.search);
    const appraisalId = urlParams.get('id');
    
    if (!appraisalId) {
        showAlert('Invalid appraisal ID', 'danger');
        return;
    }
    
    loadAppraisalForReview(appraisalId);
    
    const form = document.getElementById('committeeReviewForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const hideSpinner = showSpinner(submitBtn);
        
        const formData = new FormData(form);
        const reviewData = {};
        
        for (let [key, value] of formData.entries()) {
            reviewData[key] = value;
        }
        
        try {
            const response = await fetch(`/api/committee/review/${appraisalId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('Review completed successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/committee-dashboard.html';
                }, 2000);
            } else {
                showAlert(result.message, 'danger');
            }
        } catch (error) {
            showAlert('Review failed. Please try again.', 'danger');
        }
        
        hideSpinner();
    });
}

// Load appraisal data for HOD evaluation
async function loadAppraisalForEvaluation(appraisalId) {
    try {
        const response = await fetch('/api/hod/appraisals');
        const appraisals = await response.json();
        const appraisal = appraisals.find(a => a.id == appraisalId);
        
        if (!appraisal) {
            showAlert('Appraisal not found', 'danger');
            return;
        }
        
        // Populate staff information
        if (document.getElementById('staffName')) {
            document.getElementById('staffName').textContent = appraisal.staffName;
        }
        if (document.getElementById('department')) {
            document.getElementById('department').textContent = appraisal.department;
        }
        if (document.getElementById('submissionDate')) {
            document.getElementById('submissionDate').textContent = new Date(appraisal.submittedAt).toLocaleDateString();
        }
        
        // Display staff form data
        const staffDataContainer = document.getElementById('staffFormData');
        if (staffDataContainer) {
            staffDataContainer.innerHTML = formatStaffData(appraisal.data);
        }
        
    } catch (error) {
        showAlert('Error loading appraisal data', 'danger');
    }
}

// Load appraisal data for committee review
async function loadAppraisalForReview(appraisalId) {
    try {
        const response = await fetch('/api/committee/appraisals');
        const appraisals = await response.json();
        const appraisal = appraisals.find(a => a.id == appraisalId);
        
        if (!appraisal) {
            showAlert('Appraisal not found', 'danger');
            return;
        }
        
        // Populate staff and HOD information
        if (document.getElementById('staffName')) {
            document.getElementById('staffName').textContent = appraisal.staffName;
        }
        if (document.getElementById('department')) {
            document.getElementById('department').textContent = appraisal.department;
        }
        if (document.getElementById('hodEvaluator')) {
            document.getElementById('hodEvaluator').textContent = appraisal.hodEvaluation.evaluatedBy;
        }
        if (document.getElementById('hodScore')) {
            document.getElementById('hodScore').textContent = appraisal.hodEvaluation.totalScore || 'N/A';
        }
        
        // Display complete appraisal data
        const fullDataContainer = document.getElementById('fullAppraisalData');
        if (fullDataContainer) {
            fullDataContainer.innerHTML = formatFullAppraisalData(appraisal);
        }
        
    } catch (error) {
        showAlert('Error loading appraisal data', 'danger');
    }
}

// Format staff data for display
function formatStaffData(data) {
    return `
        <div class="row">
            <div class="col-md-6">
                <h6>Personal Information</h6>
                <p><strong>Name:</strong> ${data.employeeName || 'N/A'}</p>
                <p><strong>Date of Birth:</strong> ${data.dateOfBirth || 'N/A'}</p>
                <p><strong>Marital Status:</strong> ${data.maritalStatus || 'N/A'}</p>
            </div>
            <div class="col-md-6">
                <h6>Employment Details</h6>
                <p><strong>Date of First Appointment:</strong> ${data.firstAppointment || 'N/A'}</p>
                <p><strong>Present Status:</strong> ${data.presentStatus || 'N/A'}</p>
                <p><strong>CONTISS Level:</strong> ${data.contissLevel || 'N/A'}</p>
            </div>
        </div>
        <div class="mt-3">
            <h6>Job Description</h6>
            <p>${data.jobDescription || 'N/A'}</p>
        </div>
    `;
}

// Format full appraisal data for committee review
function formatFullAppraisalData(appraisal) {
    return `
        <div class="card mb-3">
            <div class="card-header">
                <h6>Staff Information</h6>
            </div>
            <div class="card-body">
                ${formatStaffData(appraisal.data)}
            </div>
        </div>
        <div class="card mb-3">
            <div class="card-header">
                <h6>HOD Evaluation</h6>
            </div>
            <div class="card-body">
                <p><strong>Evaluated by:</strong> ${appraisal.hodEvaluation.evaluatedBy}</p>
                <p><strong>Total Score:</strong> ${appraisal.hodEvaluation.totalScore || 'N/A'}</p>
                <p><strong>Comments:</strong> ${appraisal.hodEvaluation.comments || 'None'}</p>
                <p><strong>Recommendation:</strong> ${appraisal.hodEvaluation.recommendation || 'None'}</p>
            </div>
        </div>
    `;
}

// Calculate score from form data
function calculateScore(formData) {
    let totalScore = 0;
    let itemCount = 0;
    
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('item_') && value !== '') {
            totalScore += parseInt(value);
            itemCount++;
        }
    }
    
    return itemCount > 0 ? Math.round((totalScore / itemCount) * 20) : 0;
}

// File upload functionality
function setupFileUpload() {
    const fileInput = document.getElementById('supportingDocument');
    const uploadArea = document.querySelector('.file-upload-area');
    
    if (!fileInput || !uploadArea) return;
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            updateFileDisplay(files[0]);
        }
    });
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            updateFileDisplay(e.target.files[0]);
        }
    });
}

function updateFileDisplay(file) {
    const uploadArea = document.querySelector('.file-upload-area');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i class="fas fa-file-alt fa-2x text-success mb-2"></i>
            <p class="mb-0"><strong>Selected:</strong> ${file.name}</p>
            <p class="text-muted">Size: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
        `;
    }
}

// Initialize page-specific functions
document.addEventListener('DOMContentLoaded', function() {
    // Common initialization
    loadUserInfo();
    
    // Page-specific initialization
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('login.html')) {
        handleLogin();
    } else if (currentPath.includes('staff-form.html')) {
        handleStaffAppraisal();
        setupFileUpload();
    } else if (currentPath.includes('staff-dashboard.html')) {
        loadStaffAppraisals();
    } else if (currentPath.includes('hod-dashboard.html')) {
        loadHODAppraisals();
    } else if (currentPath.includes('hod-evaluation.html')) {
        handleHODEvaluation();
    } else if (currentPath.includes('committee-dashboard.html')) {
        loadCommitteeAppraisals();
    } else if (currentPath.includes('committee-review.html')) {
        handleCommitteeReview();
    }
});

// Export functions for global access
window.logout = logout;
window.viewAppraisal = viewAppraisal;
window.viewFullAppraisal = viewFullAppraisal;
window.evaluateAppraisal = evaluateAppraisal;
window.reviewAppraisal = reviewAppraisal;
window.viewCompleteAssessment = viewCompleteAssessment;
window.goToEvaluation = goToEvaluation;
window.goToReview = goToReview;