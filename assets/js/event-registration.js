// Event Registration System with Capacity Management and Attendee Details
(function() {
    let currentEventId = null;
    let currentEventData = null;
    let attendeeDetails = [];
    let attendeeRowCounter = 0;
    
    async function getEventCapacity() {
        if (!currentEventData || !currentEventId) return { total: 0, registered: 0, remaining: 0, maxOrg: null };
        
        try {
            if (!window.supabase) {
                return { total: 0, registered: 0, remaining: 0, maxOrg: null };
            }

            const { data: eventRegistrations, error } = await window.supabase
                .from('event_registrations')
                .select('number_of_attendees')
                .eq('event_id', currentEventId);
            
            if (error) {
                console.error('Error fetching registrations:', error);
                return { total: 0, registered: 0, remaining: 0, maxOrg: null };
            }
            
            const totalRegistered = (eventRegistrations || []).reduce((sum, reg) => sum + (reg.number_of_attendees || 1), 0);
            const maxTotal = currentEventData.max_attendees || currentEventData.maxAttendees || 0;
            const remaining = maxTotal > 0 ? Math.max(0, maxTotal - totalRegistered) : Infinity;
            
            return {
                total: maxTotal,
                registered: totalRegistered,
                remaining: remaining,
                maxOrg: currentEventData.max_attendees_per_organization || currentEventData.maxAttendeesPerOrganization || null
            };
        } catch (error) {
            console.error('Error in getEventCapacity:', error);
            return { total: 0, registered: 0, remaining: 0, maxOrg: null };
        }
    }
    
    async function updateCapacityInfo() {
        const capacityInfo = document.getElementById('capacity-info');
        const attendeesInput = document.getElementById('number-of-attendees');
        const orgWarning = document.getElementById('org-capacity-warning');
        
        if (!capacityInfo || !attendeesInput) return;
        
        const capacity = await getEventCapacity();
        const requestedAttendees = parseInt(attendeesInput.value) || 1;
        const registrationType = document.getElementById('registration-type').value;
        
        // Update capacity info
        if (capacity.total > 0) {
            if (capacity.remaining === 0) {
                capacityInfo.innerHTML = `<span style="color: #ef4444;">⚠️ Event is full. No slots available.</span>`;
                attendeesInput.disabled = true;
            } else if (capacity.remaining < requestedAttendees) {
                capacityInfo.innerHTML = `<span style="color: #f59e0b;">⚠️ Only ${capacity.remaining} slot(s) remaining. Please adjust number of attendees.</span>`;
                attendeesInput.max = capacity.remaining;
            } else {
                capacityInfo.innerHTML = `<span style="color: #10b981;">✓ ${capacity.remaining} slot(s) available</span>`;
                attendeesInput.max = capacity.remaining;
            }
        } else {
            capacityInfo.innerHTML = `<span style="color: var(--text-secondary);">Unlimited capacity</span>`;
            attendeesInput.removeAttribute('max');
        }
        
        // Organization attendee limit warning
        if (registrationType === 'organization' && capacity.maxOrg && requestedAttendees > capacity.maxOrg) {
            orgWarning.style.display = 'block';
            orgWarning.innerHTML = `<span style="color: #ef4444;">⚠️ Maximum ${capacity.maxOrg} attendees allowed per organization. Please reduce the number.</span>`;
            attendeesInput.max = capacity.maxOrg;
        } else {
            orgWarning.style.display = 'none';
        }
    }
    
    async function openEventRegistration(eventId) {
        const modal = document.getElementById('event-registration-modal');
        const form = document.getElementById('event-registration-form');
        const eventIdInput = document.getElementById('registration-event-id');
        const registrationType = document.getElementById('registration-type');
        
        if (!modal || !form || !eventIdInput) return;
        
        try {
            // Get event data from Supabase
            if (!window.supabase) {
                alert('Database connection not available. Please refresh the page.');
                return;
            }

            const { data: event, error } = await window.supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();
            
            if (error || !event) {
                alert('Event not found. Please refresh the page and try again.');
                return;
            }
            
            // Map Supabase field names to expected format
            currentEventData = {
                id: event.id,
                title: event.title,
                date: event.date,
                time: event.time,
                location: event.location,
                description: event.description,
                venue: event.venue,
                contactName: event.contact_name,
                contactEmail: event.contact_email,
                contactPhone: event.contact_phone,
                image: event.image,
                registrationLink: event.registration_link,
                featured: event.featured,
                maxAttendees: event.max_attendees,
                maxAttendeesPerOrganization: event.max_attendees_per_organization,
                documents: event.documents || []
            };
        
        // Check if event is full
        const capacity = await getEventCapacity();
        if (capacity.total > 0 && capacity.remaining === 0) {
            alert('Sorry, this event is full. No slots available.');
            return;
        }
        
        currentEventId = eventId;
        eventIdInput.value = eventId;
        attendeeDetails = [];
        attendeeRowCounter = 0;
        
        // Reset form
        form.reset();
        document.getElementById('registration-type').value = '';
        document.getElementById('attendees-list').innerHTML = '';
        toggleRegistrationFields('individual');
        await updateCapacityInfo();
            
            // Update modal title
            const title = document.getElementById('registration-modal-title');
            if (title) {
                title.textContent = `Register for: ${currentEventData.title}`;
            }
            
            // Show modal
            modal.setAttribute('aria-hidden', 'false');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error loading event for registration:', error);
            alert('Error loading event. Please try again.');
        }
    }
    
    function closeEventRegistration() {
        const modal = document.getElementById('event-registration-modal');
        if (!modal) return;
        
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        const form = document.getElementById('event-registration-form');
        if (form) form.reset();
        document.getElementById('attendees-list').innerHTML = '';
        attendeeDetails = [];
        attendeeRowCounter = 0;
        
        currentEventId = null;
        currentEventData = null;
    }
    
    function toggleRegistrationFields(type) {
        const individualFields = document.getElementById('individual-fields');
        const organizationFields = document.getElementById('organization-fields');
        const organizationContactFields = document.getElementById('organization-contact-fields');
        const organizationAttendeesSection = document.getElementById('organization-attendees-section');
        const nameInput = document.getElementById('registrant-name');
        const orgNameInput = document.getElementById('organization-name');
        const contactPersonInput = document.getElementById('contact-person');
        const attendeesInput = document.getElementById('number-of-attendees');
        
        if (type === 'organization') {
            if (individualFields) individualFields.style.display = 'none';
            if (organizationFields) organizationFields.style.display = 'block';
            if (organizationContactFields) organizationContactFields.style.display = 'block';
            if (organizationAttendeesSection) organizationAttendeesSection.style.display = 'block';
            if (nameInput) nameInput.removeAttribute('required');
            if (orgNameInput) orgNameInput.setAttribute('required', 'required');
            if (contactPersonInput) contactPersonInput.setAttribute('required', 'required');
            
            // Initialize attendee rows based on number of attendees
            const numAttendees = parseInt(attendeesInput.value) || 1;
            updateAttendeeRows(numAttendees);
        } else {
            if (individualFields) individualFields.style.display = 'block';
            if (organizationFields) organizationFields.style.display = 'none';
            if (organizationContactFields) organizationContactFields.style.display = 'none';
            if (organizationAttendeesSection) organizationAttendeesSection.style.display = 'none';
            if (nameInput) nameInput.setAttribute('required', 'required');
            if (orgNameInput) orgNameInput.removeAttribute('required');
            if (contactPersonInput) contactPersonInput.removeAttribute('required');
            document.getElementById('attendees-list').innerHTML = '';
            attendeeDetails = [];
        }
        updateCapacityInfo();
    }
    
    function addAttendeeRow() {
        const rowId = `attendee-${++attendeeRowCounter}`;
        const attendeesList = document.getElementById('attendees-list');
        
        const row = document.createElement('div');
        row.id = rowId;
        row.className = 'attendee-row';
        row.style.cssText = 'display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: end;';
        row.innerHTML = `
            <div>
                <input type="text" placeholder="Full Name *" class="attendee-name" required>
            </div>
            <div>
                <input type="text" placeholder="Position" class="attendee-position">
            </div>
            <div>
                <input type="email" placeholder="Email" class="attendee-email">
            </div>
            <div>
                <input type="tel" placeholder="Phone" class="attendee-phone">
            </div>
            <div>
                <button type="button" onclick="removeAttendeeRow('${rowId}')" style="padding: 0.5rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners for real-time validation
        const emailInput = row.querySelector('.attendee-email');
        const phoneInput = row.querySelector('.attendee-phone');
        
        if (emailInput) {
            emailInput.addEventListener('blur', () => validateAttendeeDetails());
            emailInput.addEventListener('input', () => {
                // Clear error on input
                emailInput.style.borderColor = '';
                const errorMsg = emailInput.parentElement.querySelector('.field-error');
                if (errorMsg) errorMsg.remove();
            });
        }
        
        if (phoneInput) {
            phoneInput.addEventListener('blur', () => validateAttendeeDetails());
            phoneInput.addEventListener('input', () => {
                // Clear error on input
                phoneInput.style.borderColor = '';
                const errorMsg = phoneInput.parentElement.querySelector('.field-error');
                if (errorMsg) errorMsg.remove();
            });
        }
        
        attendeesList.appendChild(row);
    }
    
    function removeAttendeeRow(rowId) {
        const row = document.getElementById(rowId);
        if (row) row.remove();
        updateAttendeeDetails();
    }
    
    function updateAttendeeRows(count) {
        const attendeesList = document.getElementById('attendees-list');
        attendeesList.innerHTML = '';
        attendeeRowCounter = 0;
        
        for (let i = 0; i < count; i++) {
            addAttendeeRow();
        }
    }
    
    function updateAttendeeDetails() {
        const rows = document.querySelectorAll('.attendee-row');
        attendeeDetails = [];
        
        rows.forEach(row => {
            const name = row.querySelector('.attendee-name').value.trim();
            if (name) {
                attendeeDetails.push({
                    name: name,
                    position: row.querySelector('.attendee-position').value.trim() || '',
                    email: row.querySelector('.attendee-email').value.trim() || '',
                    phone: row.querySelector('.attendee-phone').value.trim() || ''
                });
            }
        });
        
        // Validate for duplicates and show warnings
        validateAttendeeDetails();
    }
    
    function validateAttendeeDetails() {
        const rows = document.querySelectorAll('.attendee-row');
        const registrations = JSON.parse(localStorage.getItem('event-registrations') || '[]');
        
        // Clear previous error indicators
        rows.forEach(row => {
            const emailInput = row.querySelector('.attendee-email');
            const phoneInput = row.querySelector('.attendee-phone');
            if (emailInput) {
                emailInput.style.borderColor = '';
                const errorMsg = row.querySelector('.email-error');
                if (errorMsg) errorMsg.remove();
            }
            if (phoneInput) {
                phoneInput.style.borderColor = '';
                const errorMsg = row.querySelector('.phone-error');
                if (errorMsg) errorMsg.remove();
            }
        });
        
        const seenEmails = new Map();
        const seenPhones = new Map();
        const existingEmails = new Set();
        const existingPhones = new Set();
        
        // Collect existing registrations
        registrations.forEach(reg => {
            if (reg.eventId && reg.eventId.toString() === currentEventId.toString()) {
                if (reg.email) {
                    const cleanEmail = cleanContactValue(reg.email);
                    if (cleanEmail) existingEmails.add(cleanEmail);
                }
                if (reg.phone) {
                    const cleanPhone = cleanContactValue(reg.phone);
                    if (cleanPhone) existingPhones.add(cleanPhone);
                }
                if (reg.attendeeDetails) {
                    reg.attendeeDetails.forEach(attendee => {
                        if (attendee.email) {
                            const cleanEmail = cleanContactValue(attendee.email);
                            if (cleanEmail) existingEmails.add(cleanEmail);
                        }
                        if (attendee.phone) {
                            const cleanPhone = cleanContactValue(attendee.phone);
                            if (cleanPhone) existingPhones.add(cleanPhone);
                        }
                    });
                }
            }
        });
        
        // Check each row
        rows.forEach((row, index) => {
            const emailInput = row.querySelector('.attendee-email');
            const phoneInput = row.querySelector('.attendee-phone');
            const nameInput = row.querySelector('.attendee-name');
            const name = nameInput ? nameInput.value.trim() : '';
            
            if (emailInput && emailInput.value.trim()) {
                const email = emailInput.value.trim();
                const cleanEmail = cleanContactValue(email);
                
                if (cleanEmail) {
                    // Check against existing
                    if (existingEmails.has(cleanEmail)) {
                        showFieldError(emailInput, 'This email is already registered for this event.');
                    }
                    // Check for duplicates within form
                    else if (seenEmails.has(cleanEmail)) {
                        showFieldError(emailInput, 'This email is duplicated in your attendee list.');
                    } else {
                        seenEmails.set(cleanEmail, index);
                    }
                }
            }
            
            if (phoneInput && phoneInput.value.trim()) {
                const phone = phoneInput.value.trim();
                const cleanPhone = cleanContactValue(phone);
                
                if (cleanPhone) {
                    // Check against existing
                    if (existingPhones.has(cleanPhone)) {
                        showFieldError(phoneInput, 'This phone number is already registered for this event.');
                    }
                    // Check for duplicates within form
                    else if (seenPhones.has(cleanPhone)) {
                        showFieldError(phoneInput, 'This phone number is duplicated in your attendee list.');
                    } else {
                        seenPhones.set(cleanPhone, index);
                    }
                }
            }
        });
    }
    
    function showFieldError(input, message) {
        input.style.borderColor = '#ef4444';
        input.style.borderWidth = '2px';
        
        // Remove existing error message
        const existingError = input.parentElement.querySelector('.field-error');
        if (existingError) existingError.remove();
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.25rem;';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        input.parentElement.appendChild(errorDiv);
    }
    
    function downloadAttendeeTemplate() {
        const csvContent = `Name,Position,Email,Phone\nJohn Doe,Manager,john@example.com,+254712345678\nJane Smith,Coordinator,jane@example.com,+254712345679`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'attendee-template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Helper function to clean and normalize contact info
    function cleanContactValue(value) {
        if (!value) return '';
        return String(value).trim().toLowerCase().replace(/[\s\-()]/g, '');
    }
    
    // Helper function to validate duplicates
    function checkDuplicates(attendees, existingRegistrations, currentEventId) {
        const errors = [];
        const seenEmails = new Map(); // email -> row number
        const seenPhones = new Map(); // phone -> row number
        const existingEmails = new Set();
        const existingPhones = new Set();
        
        // Collect existing registrations for this event
        if (existingRegistrations && currentEventId) {
            existingRegistrations.forEach(reg => {
                if (reg.eventId && reg.eventId.toString() === currentEventId.toString()) {
                    // Check main registrant
                    if (reg.email) {
                        const cleanEmail = cleanContactValue(reg.email);
                        if (cleanEmail) existingEmails.add(cleanEmail);
                    }
                    if (reg.phone) {
                        const cleanPhone = cleanContactValue(reg.phone);
                        if (cleanPhone) existingPhones.add(cleanPhone);
                    }
                    
                    // Check attendee details
                    if (reg.attendeeDetails && reg.attendeeDetails.length > 0) {
                        reg.attendeeDetails.forEach(attendee => {
                            if (attendee.email) {
                                const cleanEmail = cleanContactValue(attendee.email);
                                if (cleanEmail) existingEmails.add(cleanEmail);
                            }
                            if (attendee.phone) {
                                const cleanPhone = cleanContactValue(attendee.phone);
                                if (cleanPhone) existingPhones.add(cleanPhone);
                            }
                        });
                    }
                }
            });
        }
        
        // Check for duplicates within the uploaded file
        attendees.forEach((attendee, index) => {
            const rowNum = index + 1;
            const name = attendee.name || 'Unknown';
            
            if (attendee.email) {
                const cleanEmail = cleanContactValue(attendee.email);
                if (cleanEmail) {
                    // Check against existing registrations
                    if (existingEmails.has(cleanEmail)) {
                        errors.push({
                            row: rowNum,
                            name: name,
                            field: 'Email',
                            value: attendee.email,
                            type: 'existing',
                            message: `Row ${rowNum} (${name}): Email "${attendee.email}" is already registered for this event.`
                        });
                    }
                    // Check for duplicates within the file
                    if (seenEmails.has(cleanEmail)) {
                        const firstRow = seenEmails.get(cleanEmail);
                        errors.push({
                            row: rowNum,
                            name: name,
                            field: 'Email',
                            value: attendee.email,
                            type: 'duplicate',
                            message: `Row ${rowNum} (${name}): Email "${attendee.email}" is duplicated. First occurrence at row ${firstRow}.`
                        });
                    } else {
                        seenEmails.set(cleanEmail, rowNum);
                    }
                }
            }
            
            if (attendee.phone) {
                const cleanPhone = cleanContactValue(attendee.phone);
                if (cleanPhone) {
                    // Check against existing registrations
                    if (existingPhones.has(cleanPhone)) {
                        errors.push({
                            row: rowNum,
                            name: name,
                            field: 'Phone',
                            value: attendee.phone,
                            type: 'existing',
                            message: `Row ${rowNum} (${name}): Phone "${attendee.phone}" is already registered for this event.`
                        });
                    }
                    // Check for duplicates within the file
                    if (seenPhones.has(cleanPhone)) {
                        const firstRow = seenPhones.get(cleanPhone);
                        errors.push({
                            row: rowNum,
                            name: name,
                            field: 'Phone',
                            value: attendee.phone,
                            type: 'duplicate',
                            message: `Row ${rowNum} (${name}): Phone "${attendee.phone}" is duplicated. First occurrence at row ${firstRow}.`
                        });
                    } else {
                        seenPhones.set(cleanPhone, rowNum);
                    }
                }
            }
        });
        
        return errors;
    }

    function handleExcelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                
                const nameIndex = headers.findIndex(h => h.includes('name'));
                const positionIndex = headers.findIndex(h => h.includes('position') || h.includes('role'));
                const emailIndex = headers.findIndex(h => h.includes('email'));
                const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('tel'));
                
                if (nameIndex === -1) {
                    alert('Error: Could not find "Name" column in the file.');
                    return;
                }
                
                const attendeesList = document.getElementById('attendees-list');
                attendeesList.innerHTML = '';
                attendeeDetails = [];
                attendeeRowCounter = 0;
                
                // Parse rows and collect data for validation
                const parsedAttendees = [];
                const rows = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    if (values[nameIndex]) {
                        const attendee = {
                            name: values[nameIndex] || '',
                            position: values[positionIndex] || '',
                            email: values[emailIndex] || '',
                            phone: values[phoneIndex] || ''
                        };
                        parsedAttendees.push(attendee);
                        rows.push({ attendee, rowNum: i + 1 });
                    }
                }
                
                // Check for duplicates
                const existingRegistrations = JSON.parse(localStorage.getItem('event-registrations') || '[]');
                const duplicateErrors = checkDuplicates(parsedAttendees, existingRegistrations, currentEventId);
                
                if (duplicateErrors.length > 0) {
                    // Show detailed error message
                    let errorMessage = '❌ Duplicate or existing contact information found:\n\n';
                    duplicateErrors.forEach(error => {
                        errorMessage += `${error.message}\n`;
                    });
                    errorMessage += '\nPlease fix these issues and try again.';
                    
                    alert(errorMessage);
                    
                    // Highlight rows with errors (optional - could add visual indicators)
                    // For now, we'll just prevent adding them
                    return;
                }
                
                // If no duplicates, add rows to the form
                rows.forEach(({ attendee, rowNum }) => {
                    const rowId = `attendee-${++attendeeRowCounter}`;
                    const row = document.createElement('div');
                    row.id = rowId;
                    row.className = 'attendee-row';
                    row.style.cssText = 'display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: end;';
                    row.innerHTML = `
                        <div>
                            <input type="text" value="${attendee.name || ''}" placeholder="Full Name *" class="attendee-name" required>
                        </div>
                        <div>
                            <input type="text" value="${attendee.position || ''}" placeholder="Position" class="attendee-position">
                        </div>
                        <div>
                            <input type="email" value="${attendee.email || ''}" placeholder="Email" class="attendee-email">
                        </div>
                        <div>
                            <input type="tel" value="${attendee.phone || ''}" placeholder="Phone" class="attendee-phone">
                        </div>
                        <div>
                            <button type="button" onclick="removeAttendeeRow('${rowId}')" style="padding: 0.5rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    // Add event listeners for real-time validation
                    const emailInput = row.querySelector('.attendee-email');
                    const phoneInput = row.querySelector('.attendee-phone');
                    
                    if (emailInput) {
                        emailInput.addEventListener('blur', () => validateAttendeeDetails());
                        emailInput.addEventListener('input', () => {
                            emailInput.style.borderColor = '';
                            const errorMsg = emailInput.parentElement.querySelector('.field-error');
                            if (errorMsg) errorMsg.remove();
                        });
                    }
                    
                    if (phoneInput) {
                        phoneInput.addEventListener('blur', () => validateAttendeeDetails());
                        phoneInput.addEventListener('input', () => {
                            phoneInput.style.borderColor = '';
                            const errorMsg = phoneInput.parentElement.querySelector('.field-error');
                            if (errorMsg) errorMsg.remove();
                        });
                    }
                    
                    attendeesList.appendChild(row);
                });
                
                // Run validation after adding all rows
                setTimeout(() => validateAttendeeDetails(), 100);
                
                // Update number of attendees input
                const numAttendees = document.getElementById('number-of-attendees');
                if (numAttendees) {
                    numAttendees.value = attendeesList.children.length;
                    updateCapacityInfo();
                }
                
                alert(`✅ Successfully loaded ${attendeesList.children.length} attendee(s) from file with no duplicates.`);
            } catch (error) {
                console.error('Error parsing file:', error);
                alert('Error parsing file. Please check the format and try again.');
            }
        };
        reader.readAsText(file);
    }
    
    async function saveRegistration(formData) {
        try {
            const capacity = await getEventCapacity();
            const requestedAttendees = parseInt(formData.numberOfAttendees) || 1;
            
            // Check capacity
            if (capacity.total > 0 && capacity.remaining < requestedAttendees) {
                showAlert(`Only ${capacity.remaining} slot(s) available. Please reduce the number of attendees.`, 'error');
                return false;
            }
            
            // Check organization limit
            if (formData.registrationType === 'organization' && capacity.maxOrg && requestedAttendees > capacity.maxOrg) {
                showAlert(`Maximum ${capacity.maxOrg} attendees allowed per organization.`, 'error');
                return false;
            }
            
            // For organizations, collect attendee details
            if (formData.registrationType === 'organization') {
                updateAttendeeDetails();
                // Validate that we have details for all attendees
                if (attendeeDetails.length < requestedAttendees) {
                    showAlert(`Please provide details for all ${requestedAttendees} attendee(s).`, 'error');
                    return false;
                }
            }
            
            // Check for duplicates in Supabase
            if (!window.supabase) {
                showAlert('Database connection not available. Please refresh the page and try again.', 'error');
                return false;
            }

            const cleanEmail = cleanContactValue(formData.email);
            const cleanPhone = cleanContactValue(formData.phone);
            
            // Fetch existing registrations for this event from Supabase
            const { data: existingRegistrations, error: fetchError } = await window.supabase
                .from('event_registrations')
                .select('*')
                .eq('event_id', currentEventId);
            
            if (fetchError) {
                console.error('Error checking duplicates:', fetchError);
                showAlert('Error checking registration. Please try again.', 'error');
                return false;
            }
            
            // Check for duplicate email/phone in existing registrations
            const duplicateCheck = (existingRegistrations || []).filter(reg => {
                // Check main registrant
                const regCleanEmail = cleanContactValue(reg.registrant_email || reg.contact_email);
                const regCleanPhone = cleanContactValue(reg.registrant_phone || reg.contact_phone);
                
                if (cleanEmail && regCleanEmail && cleanEmail === regCleanEmail) {
                    return true;
                }
                if (cleanPhone && regCleanPhone && cleanPhone === regCleanPhone) {
                    return true;
                }
                
                // Check attendee details
                if (reg.attendee_details && reg.attendee_details.length > 0) {
                    return reg.attendee_details.some(attendee => {
                        const attendeeCleanEmail = cleanContactValue(attendee.email);
                        const attendeeCleanPhone = cleanContactValue(attendee.phone);
                        return (cleanEmail && attendeeCleanEmail && cleanEmail === attendeeCleanEmail) ||
                               (cleanPhone && attendeeCleanPhone && cleanPhone === attendeeCleanPhone);
                    });
                }
                
                return false;
            });
            
            if (duplicateCheck.length > 0) {
                const duplicateReg = duplicateCheck[0];
                let errorMsg = '❌ This contact information is already registered for this event:\n\n';
                const regEmail = duplicateReg.registrant_email || duplicateReg.contact_email;
                const regPhone = duplicateReg.registrant_phone || duplicateReg.contact_phone;
                if (cleanEmail && cleanContactValue(regEmail) === cleanEmail) {
                    errorMsg += `Email "${formData.email}" is already registered.\n`;
                }
                if (cleanPhone && cleanContactValue(regPhone) === cleanPhone) {
                    errorMsg += `Phone "${formData.phone}" is already registered.\n`;
                }
                errorMsg += '\nPlease use a different email or phone number.';
                showAlert(errorMsg, 'error');
                return false;
            }
            
            // Check for duplicates within attendee details (for organizations)
            if (formData.registrationType === 'organization' && attendeeDetails.length > 0) {
                const attendeeErrors = checkDuplicates(attendeeDetails, existingRegistrations, currentEventId);
                if (attendeeErrors.length > 0) {
                    let errorMsg = '❌ Duplicate contact information found in attendee list:\n\n';
                    attendeeErrors.forEach(error => {
                        errorMsg += `${error.message}\n`;
                    });
                    errorMsg += '\nPlease fix these issues and try again.';
                    showAlert(errorMsg, 'error');
                    return false;
                }
            }
            
            // Prepare registration data for Supabase
            const registrationData = {
                event_id: currentEventId,
                registration_type: formData.registrationType,
                registrant_name: formData.registrationType === 'individual' ? formData.name : null,
                registrant_email: formData.registrationType === 'individual' ? formData.email : null,
                registrant_phone: formData.registrationType === 'individual' ? formData.phone : null,
                organization_name: formData.registrationType === 'organization' ? formData.organizationName : null,
                contact_person: formData.registrationType === 'organization' ? formData.contactPerson : null,
                contact_email: formData.registrationType === 'organization' ? formData.email : null,
                contact_phone: formData.registrationType === 'organization' ? formData.phone : null,
                number_of_attendees: requestedAttendees,
                attendee_details: formData.registrationType === 'organization' ? attendeeDetails : [],
                special_requirements: formData.specialRequirements || null,
                dietary_restrictions: formData.dietaryRestrictions || null,
                additional_notes: formData.additionalNotes || null
            };
            
            // Insert into Supabase
            const { data: insertedRegistration, error: insertError } = await window.supabase
                .from('event_registrations')
                .insert([registrationData])
                .select();
            
            if (insertError) {
                console.error('Error saving registration:', insertError);
                showAlert(`Error saving registration: ${insertError.message || 'Please try again.'}`, 'error');
                return false;
            }
            
            // Dispatch event for admin panel
            window.dispatchEvent(new CustomEvent('event-registration-added', { detail: insertedRegistration[0] }));
            
            return true;
        } catch (error) {
            console.error('Error saving registration:', error);
            return false;
        }
    }
    
    function showAlert(message, type = 'success') {
        const alertDiv = document.getElementById('registration-alert');
        if (!alertDiv) return;
        
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.display = 'block';
        
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 5000);
    }
    
    // Initialize
    function init() {
        const modal = document.getElementById('event-registration-modal');
        const overlay = document.getElementById('event-registration-overlay');
        const closeBtn = document.getElementById('event-registration-close');
        const form = document.getElementById('event-registration-form');
        const registrationType = document.getElementById('registration-type');
        const attendeesInput = document.getElementById('number-of-attendees');
        
        if (!modal) return;
        
        // Close modal handlers
        if (overlay) overlay.addEventListener('click', closeEventRegistration);
        if (closeBtn) closeBtn.addEventListener('click', closeEventRegistration);
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeEventRegistration();
            }
        });
        
        // Registration type change handler
        if (registrationType) {
            registrationType.addEventListener('change', (e) => {
                toggleRegistrationFields(e.target.value);
            });
        }
        
        // Number of attendees change handler
        if (attendeesInput) {
            attendeesInput.addEventListener('input', async () => {
                await updateCapacityInfo();
                const registrationType = document.getElementById('registration-type').value;
                if (registrationType === 'organization') {
                    const count = parseInt(attendeesInput.value) || 1;
                    updateAttendeeRows(count);
                }
            });
        }
        
        // Form submission
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                // Validate
                if (!data.registrationType) {
                    showAlert('Please select a registration type.', 'error');
                    return;
                }
                
                if (data.registrationType === 'individual' && !data.name) {
                    showAlert('Please enter your full name.', 'error');
                    return;
                }
                
                if (data.registrationType === 'organization') {
                    if (!data.organizationName) {
                        showAlert('Please enter organization name.', 'error');
                        return;
                    }
                    if (!data.contactPerson) {
                        showAlert('Please enter contact person name.', 'error');
                        return;
                    }
                }
                
                if (!data.email || !data.phone) {
                    showAlert('Please fill in all required fields.', 'error');
                    return;
                }
                
                // Save registration
                if (await saveRegistration(data)) {
                    showAlert('✅ Registration submitted successfully! You will receive a confirmation email shortly.', 'success');
                    
                    setTimeout(() => {
                        closeEventRegistration();
                    }, 2000);
                } else {
                    // Error message already shown in saveRegistration
                }
            });
        }
    }
    
    // Make functions globally accessible
    window.openEventRegistration = openEventRegistration;
    window.closeEventRegistration = closeEventRegistration;
    window.addAttendeeRow = addAttendeeRow;
    window.removeAttendeeRow = removeAttendeeRow;
    window.downloadAttendeeTemplate = downloadAttendeeTemplate;
    window.handleExcelUpload = handleExcelUpload;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
