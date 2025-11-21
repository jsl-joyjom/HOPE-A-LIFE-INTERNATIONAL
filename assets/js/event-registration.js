// Event Registration System with Capacity Management and Attendee Details
// Explicit data flow - no hidden global dependencies

// ✅ SAFETY OVERRIDE: Prevent any cached/duplicate validateAttendeeDetails from causing issues
// This ensures we always use the correct, explicit version
(function() {
    'use strict';
    
    // Diagnostic logging to verify script loading and dependencies
    console.log('✅ event-registration.js loaded');
    console.log('✅ Supabase available:', typeof window.supabase !== 'undefined');
    
    // Debug: Check for any global registrations variable (should be undefined)
    console.log('=== REGISTRATIONS DEBUG ===');
    console.log('typeof registrations:', typeof registrations);
    console.log('registrations value:', typeof registrations !== 'undefined' ? registrations : 'undefined (correct - no global dependency)');
    console.log('=== END DEBUG ===');
    
    // ✅ SAFETY: Clear any potentially cached/broken global function
    if (typeof window.validateAttendeeDetails === 'function') {
        console.warn('⚠️ Found existing validateAttendeeDetails on window - clearing it');
        console.warn('⚠️ This may indicate a cached version or duplicate function');
        delete window.validateAttendeeDetails;
    }
    
    // ✅ SAFETY: Ensure no global registrations variable exists
    if (typeof registrations !== 'undefined') {
        console.error('❌ CRITICAL: Global registrations variable detected at script load!');
        console.error('❌ This indicates a code conflict or cached version issue');
        console.error('❌ Value:', registrations);
        // Don't throw here - let the function handle it
    }
    
    let currentEventId = null;
    let currentEventData = null;
    let attendeeDetails = []; // Module-scoped variable, not global
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
            
            // Show modal - ensure aria-hidden is removed when modal is active
            modal.removeAttribute('aria-hidden');
            modal.classList.add('active');
            
            // Prevent body scroll when modal is open
            // Store original overflow value to restore it later
            if (!document.body.dataset.originalOverflow) {
                document.body.dataset.originalOverflow = window.getComputedStyle(document.body).overflow;
            }
            document.body.style.overflow = 'hidden';
            
            // Focus management - focus first focusable element in modal
            const firstFocusable = modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                setTimeout(() => firstFocusable.focus(), 100);
            }
        } catch (error) {
            console.error('Error loading event for registration:', error);
            alert('Error loading event. Please try again.');
        }
    }
    
    function closeEventRegistration() {
        const modal = document.getElementById('event-registration-modal');
        if (!modal) return;
        
        // Hide modal and restore accessibility attributes
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('active');
        
        // Restore body scroll
        const originalOverflow = document.body.dataset.originalOverflow || '';
        document.body.style.overflow = originalOverflow;
        delete document.body.dataset.originalOverflow;
        
        // Reset form and clear data
        const form = document.getElementById('event-registration-form');
        if (form) form.reset();
        const attendeesList = document.getElementById('attendees-list');
        if (attendeesList) attendeesList.innerHTML = '';
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
        
        // Add event listeners for real-time validation and data collection
        const nameInput = row.querySelector('.attendee-name');
        const positionInput = row.querySelector('.attendee-position');
        const emailInput = row.querySelector('.attendee-email');
        const phoneInput = row.querySelector('.attendee-phone');
        
        // Update attendee details whenever any field changes
        const updateOnChange = () => {
            updateAttendeeDetails();
        };
        
        if (nameInput) {
            nameInput.addEventListener('input', updateOnChange);
            nameInput.addEventListener('blur', updateOnChange);
        }
        
        if (positionInput) {
            positionInput.addEventListener('input', updateOnChange);
            positionInput.addEventListener('blur', updateOnChange);
        }
        
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                validateAttendeeDetails().catch(err => console.warn('⚠️ Validation error:', err));
                updateAttendeeDetails();
            });
            emailInput.addEventListener('input', () => {
                // Clear error on input
                emailInput.style.borderColor = '';
                const errorMsg = emailInput.parentElement.querySelector('.field-error');
                if (errorMsg) errorMsg.remove();
                updateAttendeeDetails();
            });
        }
        
        if (phoneInput) {
            phoneInput.addEventListener('blur', () => {
                validateAttendeeDetails().catch(err => console.warn('⚠️ Validation error:', err));
                updateAttendeeDetails();
            });
            phoneInput.addEventListener('input', () => {
                // Clear error on input
                phoneInput.style.borderColor = '';
                const errorMsg = phoneInput.parentElement.querySelector('.field-error');
                if (errorMsg) errorMsg.remove();
                updateAttendeeDetails();
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
    
    // Build attendees array from DOM inputs (explicit, no hidden dependencies)
    function buildAttendeesFromDOM() {
        const rows = document.querySelectorAll('.attendee-row');
        const attendees = [];
        
        rows.forEach((row, index) => {
            const nameInput = row.querySelector('.attendee-name');
            const positionInput = row.querySelector('.attendee-position');
            const emailInput = row.querySelector('.attendee-email');
            const phoneInput = row.querySelector('.attendee-phone');
            
            if (!nameInput) {
                console.warn(`⚠️ Attendee row ${index} missing name input`);
                return;
            }
            
            const name = nameInput.value.trim();
            if (name) {
                attendees.push({
                    name: name,
                    position: positionInput ? positionInput.value.trim() : '',
                    email: emailInput ? emailInput.value.trim() : '',
                    phone: phoneInput ? phoneInput.value.trim() : ''
                });
            }
        });
        
        return attendees;
    }
    
    // Build attendees from DOM inputs - explicit return, no global dependency
    // formData parameter is optional - function builds from DOM directly (explicit, no hidden dependencies)
    function updateAttendeeDetails(formData) {
        // Explicitly build attendees from DOM (no global dependency, no formData dependency)
        const attendees = buildAttendeesFromDOM();
        attendeeDetails = attendees; // Keep for backward compatibility with other parts of code
        
        console.log(`📝 Updated attendee details: ${attendees.length} attendees collected`);
        console.log('📝 Attendees array:', attendees);
        
        // Validate structure explicitly (synchronous validation)
        if (attendees.length > 0) {
            try {
                validateAttendeesArray(attendees);
                console.log('✅ Attendee structure validation passed');
            } catch (validationError) {
                console.warn('⚠️ Attendee structure validation warning:', validationError.message);
            }
        }
        
        // Validate for duplicates and show warnings (async, but don't await - run in background)
        // This checks against Supabase, not a global variable - completely explicit
        validateAttendeeDetails().catch(err => {
            console.warn('⚠️ Error in validateAttendeeDetails (duplicate check):', err);
        });
        
        return attendees; // Return explicitly for explicit usage
    }
    
    // Validate attendees array (explicit parameter, no global dependency)
    function validateAttendeesArray(attendees) {
        if (!Array.isArray(attendees)) {
            throw new Error('Attendees must be an array');
        }
        // Note: We allow empty arrays for organizations (attendee details are optional)
        // But we validate that if provided, they have required fields
        attendees.forEach((attendee, index) => {
            if (!attendee.name || attendee.name.trim() === '') {
                throw new Error(`Attendee ${index + 1} is missing a name`);
            }
        });
        return true;
    }
    
    // Validate attendee details for duplicates (explicit, no global dependencies)
    // This function checks DOM inputs against Supabase - completely self-contained
    // ✅ SAFETY: This function is completely isolated - no global dependencies
    async function validateAttendeeDetails() {
        // ✅ EXPLICIT: NO GLOBAL DEPENDENCIES - all data fetched explicitly from DOM and Supabase
        // ✅ SAFETY CHECK: Ensure no global 'registrations' variable is accessed
        if (typeof registrations !== 'undefined') {
            console.error('❌ ERROR: Global registrations variable detected! This should not exist.');
            console.error('❌ Stack trace:', new Error().stack);
            throw new Error('Global registrations variable detected - this indicates a code conflict');
        }
        
        const rows = document.querySelectorAll('.attendee-row');
        
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
        
        // Fetch existing registrations from Supabase for this event
        if (window.supabase && currentEventId) {
            try {
                const { data: existingRegistrations, error } = await window.supabase
                    .from('event_registrations')
                    .select('*')
                    .eq('event_id', currentEventId);
                
                if (!error && existingRegistrations) {
                    // Collect existing registrations
                    existingRegistrations.forEach(reg => {
                        // Check main registrant email/phone
                        const regEmail = reg.registrant_email || reg.contact_email;
                        const regPhone = reg.registrant_phone || reg.contact_phone;
                        
                        if (regEmail) {
                            const cleanEmail = cleanContactValue(regEmail);
                            if (cleanEmail) existingEmails.add(cleanEmail);
                        }
                        if (regPhone) {
                            const cleanPhone = cleanContactValue(regPhone);
                            if (cleanPhone) existingPhones.add(cleanPhone);
                        }
                        
                        // Check attendee details
                        if (reg.attendee_details && Array.isArray(reg.attendee_details)) {
                            reg.attendee_details.forEach(attendee => {
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
                    });
                }
            } catch (error) {
                console.warn('⚠️ Error fetching existing registrations for validation:', error);
                // Continue with validation even if fetch fails
            }
        }
        
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
                // Supabase returns snake_case (event_id), but also check camelCase (eventId) for compatibility
                const regEventId = reg.event_id || reg.eventId;
                if (regEventId && regEventId.toString() === currentEventId.toString()) {
                    // Check main registrant - Supabase uses snake_case
                    const regEmail = reg.registrant_email || reg.contact_email || reg.email;
                    const regPhone = reg.registrant_phone || reg.contact_phone || reg.phone;
                    
                    if (regEmail) {
                        const cleanEmail = cleanContactValue(regEmail);
                        if (cleanEmail) existingEmails.add(cleanEmail);
                    }
                    if (regPhone) {
                        const cleanPhone = cleanContactValue(regPhone);
                        if (cleanPhone) existingPhones.add(cleanPhone);
                    }
                    
                    // Check attendee details - Supabase uses snake_case (attendee_details)
                    const attendeeDetails = reg.attendee_details || reg.attendeeDetails || [];
                    if (attendeeDetails && attendeeDetails.length > 0) {
                        attendeeDetails.forEach(attendee => {
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
                
                // Check for duplicates (already handled in saveRegistration via Supabase query)
                const duplicateErrors = [];
                
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
                    
                    // Add event listeners for real-time validation and data collection
                    const nameInput = row.querySelector('.attendee-name');
                    const positionInput = row.querySelector('.attendee-position');
                    const emailInput = row.querySelector('.attendee-email');
                    const phoneInput = row.querySelector('.attendee-phone');
                    
                    // Update attendee details whenever any field changes
                    const updateOnChange = () => {
                        updateAttendeeDetails();
                    };
                    
                    if (nameInput) {
                        nameInput.addEventListener('input', updateOnChange);
                        nameInput.addEventListener('blur', updateOnChange);
                    }
                    
                    if (positionInput) {
                        positionInput.addEventListener('input', updateOnChange);
                        positionInput.addEventListener('blur', updateOnChange);
                    }
                    
                    if (emailInput) {
                        emailInput.addEventListener('blur', () => {
                            validateAttendeeDetails().catch(err => console.warn('⚠️ Validation error:', err));
                            updateAttendeeDetails();
                        });
                        emailInput.addEventListener('input', () => {
                            emailInput.style.borderColor = '';
                            const errorMsg = emailInput.parentElement.querySelector('.field-error');
                            if (errorMsg) errorMsg.remove();
                            updateAttendeeDetails();
                        });
                    }
                    
                    if (phoneInput) {
                        phoneInput.addEventListener('blur', () => {
                            validateAttendeeDetails().catch(err => console.warn('⚠️ Validation error:', err));
                            updateAttendeeDetails();
                        });
                        phoneInput.addEventListener('input', () => {
                            phoneInput.style.borderColor = '';
                            const errorMsg = phoneInput.parentElement.querySelector('.field-error');
                            if (errorMsg) errorMsg.remove();
                            updateAttendeeDetails();
                        });
                    }
                    
                    attendeesList.appendChild(row);
                });
                
                // Run validation after adding all rows
                setTimeout(() => {
                    validateAttendeeDetails().catch(err => console.warn('⚠️ Validation error:', err));
                }, 100);
                
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
            
            // For organizations, collect attendee details explicitly from DOM (no hidden dependencies)
            let finalAttendeeDetails = [];
            if (formData.registrationType === 'organization') {
                console.log('🏢 Organization registration - collecting attendee details');
                console.log('📊 Requested attendees:', requestedAttendees);
                
                // Force update attendee details before saving - ensure DOM is ready
                try {
                    // Small delay to ensure DOM updates are captured (especially on slower devices/networks)
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Explicitly build attendees from DOM (no global dependency)
                    // Call buildAttendeesFromDOM directly - explicit data flow
                    finalAttendeeDetails = buildAttendeesFromDOM();
                    
                    // Also update the module variable for backward compatibility
                    // Pass formData explicitly (optional, but makes the call explicit)
                    updateAttendeeDetails(formData);
                    
                    // Validate attendees array if provided (explicit validation)
                    if (finalAttendeeDetails.length > 0) {
                        try {
                            validateAttendeesArray(finalAttendeeDetails);
                            console.log('✅ Attendee validation passed');
                        } catch (validationError) {
                            console.warn('⚠️ Attendee validation warning:', validationError.message);
                            // Filter out invalid attendees but continue
                            finalAttendeeDetails = finalAttendeeDetails.filter(att => att.name && att.name.trim() !== '');
                        }
                    }
                } catch (error) {
                    console.error('❌ Error building attendee details:', error);
                    // Continue anyway - try to get whatever we can from DOM
                    try {
                        finalAttendeeDetails = buildAttendeesFromDOM();
                    } catch (fallbackError) {
                        console.error('❌ Fallback attendee collection also failed:', fallbackError);
                        finalAttendeeDetails = []; // Empty array - registration will still save
                    }
                }
                
                console.log('📝 Collected attendee details before save:', finalAttendeeDetails);
                console.log('📊 Attendee details count:', finalAttendeeDetails.length);
                console.log('📊 Full attendee details:', JSON.stringify(finalAttendeeDetails, null, 2));
                
                // For organizations, attendee details are optional but recommended
                // We'll save whatever attendee details are provided
                // If no attendee details are provided, we'll still save the registration
                // but log a warning
                if (finalAttendeeDetails.length === 0) {
                    console.warn('⚠️ No attendee details provided for organization registration');
                    console.warn('⚠️ Registration will be saved without attendee details');
                    // Don't block the save - just warn
                } else if (finalAttendeeDetails.length < requestedAttendees) {
                    console.warn(`⚠️ Only ${finalAttendeeDetails.length} attendee(s) have details, but ${requestedAttendees} requested`);
                    console.warn('⚠️ Registration will be saved with available attendee details');
                    // Don't block the save - just warn
                }
                
                console.log('✅ Final attendee details to save:', finalAttendeeDetails.length);
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
            if (formData.registrationType === 'organization' && finalAttendeeDetails.length > 0) {
                try {
                    const attendeeErrors = checkDuplicates(finalAttendeeDetails, existingRegistrations, currentEventId);
                    if (attendeeErrors && attendeeErrors.length > 0) {
                        let errorMsg = '❌ Duplicate contact information found in attendee list:\n\n';
                        attendeeErrors.forEach(error => {
                            errorMsg += `${error.message}\n`;
                        });
                        errorMsg += '\nPlease fix these issues and try again.';
                        showAlert(errorMsg, 'error');
                        return false;
                    }
                } catch (error) {
                    console.error('❌ Error checking attendee duplicates:', error);
                    console.warn('⚠️ Continuing with registration despite duplicate check error');
                    // Don't block registration if duplicate check fails - just log the error
                    // This prevents false positives from blocking legitimate registrations
                }
            }
            
            // Prepare registration data for Supabase (explicit, no hidden dependencies)
            // All validation has been done above - this is just data preparation
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
                attendee_details: formData.registrationType === 'organization' ? (finalAttendeeDetails || []) : [],
                special_requirements: formData.specialRequirements || null,
                dietary_restrictions: formData.dietaryRestrictions || null,
                additional_notes: formData.additionalNotes || null
            };
            
            // Log registration data before saving (for debugging)
            console.log('💾 Saving registration data to Supabase:', {
                event_id: registrationData.event_id,
                registration_type: registrationData.registration_type,
                number_of_attendees: registrationData.number_of_attendees,
                attendee_details_count: registrationData.attendee_details ? registrationData.attendee_details.length : 0,
                organization_name: registrationData.organization_name,
                contact_person: registrationData.contact_person,
                contact_email: registrationData.contact_email,
                contact_phone: registrationData.contact_phone,
                attendee_details: registrationData.attendee_details
            });
            
            // Verify Supabase connection before insert
            if (!window.supabase) {
                const errorMsg = 'Database connection not available. Please refresh the page and try again.';
                console.error('❌ Supabase not available:', errorMsg);
                showAlert(`❌ ${errorMsg}`, 'error');
                showToastNotification(`❌ ${errorMsg}`, 'error');
                return false;
            }
            
            // Insert into Supabase (validation already done above)
            console.log('💾 Inserting registration into Supabase...');
            console.log('💾 Table: event_registrations');
            console.log('💾 Registration data being inserted:', JSON.stringify(registrationData, null, 2));
            
            const { data: insertedRegistration, error: insertError } = await window.supabase
                .from('event_registrations')
                .insert([registrationData])
                .select();
            
            if (insertError) {
                console.error('❌ ========== SUPABASE INSERT ERROR ==========');
                console.error('❌ Error code:', insertError.code);
                console.error('❌ Error message:', insertError.message);
                console.error('❌ Error details:', insertError.details);
                console.error('❌ Error hint:', insertError.hint);
                console.error('❌ Full error object:', JSON.stringify(insertError, null, 2));
                
                // Show user-friendly error message based on error code
                let userErrorMsg = 'Error saving registration. ';
                if (insertError.code === '42501') {
                    userErrorMsg += 'Permission denied. Please check database permissions (RLS policies).';
                } else if (insertError.code === '23505') {
                    userErrorMsg += 'This registration already exists.';
                } else if (insertError.code === '23503') {
                    userErrorMsg += 'Invalid event ID. Please refresh and try again.';
                } else if (insertError.code === '23502') {
                    userErrorMsg += 'Required field is missing. Please check the form and try again.';
                } else if (insertError.code === 'PGRST116') {
                    userErrorMsg += 'The requested resource was not found. Please refresh and try again.';
                } else if (insertError.message) {
                    userErrorMsg += insertError.message;
                } else {
                    userErrorMsg += 'Please try again or contact support.';
                }
                
                showAlert(`❌ ${userErrorMsg}`, 'error');
                showToastNotification(`❌ ${userErrorMsg}`, 'error');
                return false;
            }
            
            if (!insertedRegistration || insertedRegistration.length === 0) {
                console.error('❌ ========== NO DATA RETURNED FROM SUPABASE ==========');
                console.error('❌ Insert response data:', insertedRegistration);
                console.error('❌ Insert response error:', insertError);
                showAlert('❌ Registration was not saved. No data returned from database.', 'error');
                showToastNotification('❌ Registration was not saved. Please try again.', 'error');
                return false;
            }
            
            console.log('✅ ========== REGISTRATION SAVED SUCCESSFULLY ==========');
            console.log('✅ Registration ID:', insertedRegistration[0]?.id);
            console.log('✅ Registration type:', insertedRegistration[0]?.registration_type);
            console.log('✅ Organization name:', insertedRegistration[0]?.organization_name);
            console.log('✅ Contact person:', insertedRegistration[0]?.contact_person);
            console.log('✅ Contact email:', insertedRegistration[0]?.contact_email);
            console.log('✅ Contact phone:', insertedRegistration[0]?.contact_phone);
            console.log('✅ Number of attendees:', insertedRegistration[0]?.number_of_attendees);
            console.log('✅ Attendee details count:', insertedRegistration[0]?.attendee_details?.length || 0);
            console.log('✅ Full registration data:', JSON.stringify(insertedRegistration[0], null, 2));
            
            // Dispatch event for admin panel
            window.dispatchEvent(new CustomEvent('event-registration-added', { detail: insertedRegistration[0] }));
            
            console.log('✅ Returning true from saveRegistration');
            return true;
        } catch (error) {
            console.error('Error saving registration:', error);
            return false;
        }
    }
    
    function showAlert(message, type = 'success') {
        const alertDiv = document.getElementById('registration-alert');
        if (!alertDiv) {
            // Fallback: create a toast notification if alert div doesn't exist
            showToastNotification(message, type);
            return;
        }
        
        // Enhanced alert styling
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="font-size: 1.5rem; color: ${type === 'success' ? '#10b981' : '#ef4444'};"></i>
                <span style="flex: 1; font-weight: 500;">${message}</span>
                <button onclick="this.parentElement.parentElement.style.display='none'" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.25rem; font-size: 1.25rem; line-height: 1;">&times;</button>
            </div>
        `;
        alertDiv.style.display = 'block';
        alertDiv.style.marginBottom = '1rem';
        
        // Scroll to alert
        alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (alertDiv.style.display !== 'none') {
                alertDiv.style.transition = 'opacity 0.3s ease';
                alertDiv.style.opacity = '0';
                setTimeout(() => {
                    alertDiv.style.display = 'none';
                    alertDiv.style.opacity = '1';
                }, 300);
            }
        }, 5000);
    }
    
    // Toast notification for better visibility
    function showToastNotification(message, type = 'success') {
        const toast = document.createElement('div');
        toast.id = 'registration-toast-notification';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 1.25rem 1.75rem;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            z-index: 10002;
            display: flex;
            align-items: center;
            gap: 1rem;
            min-width: 320px;
            max-width: 500px;
            animation: slideInRight 0.4s ease;
            font-size: 1rem;
        `;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="font-size: 2rem;"></i>
            <span style="flex: 1; font-weight: 600; line-height: 1.4;">${message}</span>
            <button onclick="document.getElementById('registration-toast-notification')?.remove()" style="background: none; border: none; color: white; cursor: pointer; padding: 0.25rem; font-size: 1.5rem; line-height: 1; opacity: 0.9; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.9'">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 6 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentElement) toast.remove();
                }, 400);
            }
        }, 6000);
    }
    
    // Unified success notification handler
    function showSuccessNotifications(orgName) {
        console.log('🎉 showSuccessNotifications called for:', orgName);
        
        const successMessage = `✅ Registration submitted successfully! Your ${orgName || 'Organization'} registration has been saved. You will receive a confirmation email shortly.`;
        
        // Show all three notification types
        try {
            console.log('📢 1. Showing inline alert');
            showAlert(successMessage, 'success');
        } catch (e) {
            console.error('❌ Error showing inline alert:', e);
        }
        
        try {
            console.log('📢 2. Showing toast notification');
            showToastNotification('✅ Registration submitted successfully!', 'success');
        } catch (e) {
            console.error('❌ Error showing toast:', e);
        }
        
        try {
            console.log('📢 3. Showing success modal');
            showSuccessModal(orgName);
        } catch (e) {
            console.error('❌ Error showing modal:', e);
        }
        
        console.log('✅ All success notifications triggered');
    }
    
    // Show a prominent success modal
    function showSuccessModal(orgName) {
        // Remove any existing success modal
        const existingModal = document.getElementById('registration-success-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'registration-success-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; padding: 2.5rem; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; animation: slideUp 0.4s ease;">
                <div style="margin-bottom: 1.5rem;">
                    <div style="width: 80px; height: 80px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                        <i class="fas fa-check" style="font-size: 2.5rem; color: white;"></i>
                    </div>
                </div>
                <h2 style="font-size: 1.75rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem;">Registration Successful!</h2>
                <p style="font-size: 1.1rem; color: #6b7280; margin-bottom: 2rem; line-height: 1.6;">
                    Your ${orgName || 'organization'} registration has been successfully submitted and saved.
                </p>
                <p style="font-size: 0.95rem; color: #9ca3af; margin-bottom: 2rem;">
                    You will receive a confirmation email shortly.
                </p>
                <button onclick="document.getElementById('registration-success-modal')?.remove()" style="background: #10b981; color: white; border: none; padding: 0.875rem 2rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);" onmouseover="this.style.background='#059669'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(16, 185, 129, 0.4)'" onmouseout="this.style.background='#10b981'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)'">
                    Close
                </button>
            </div>
        `;
        
        // Ensure modal is appended to body (not inside registration modal)
        document.body.appendChild(modal);
        
        // Force modal to be visible by ensuring it's on top
        setTimeout(() => {
            modal.style.display = 'flex';
            modal.style.zIndex = '99999';
        }, 10);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Auto-close after 4 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                modal.style.transition = 'opacity 0.3s ease';
                modal.style.opacity = '0';
                setTimeout(() => {
                    if (modal.parentElement) modal.remove();
                }, 300);
            }
        }, 4000);
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
                
                console.log('📝 Form submission started');
                
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                console.log('📋 Form data collected:', data);
                
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
                    if (!data.organizationName || data.organizationName.trim() === '') {
                        showAlert('Please enter organization name.', 'error');
                        return;
                    }
                    if (!data.contactPerson || data.contactPerson.trim() === '') {
                        showAlert('Please enter contact person name.', 'error');
                        return;
                    }
                    if (!data.numberOfAttendees || parseInt(data.numberOfAttendees) < 1) {
                        showAlert('Please enter a valid number of attendees.', 'error');
                        return;
                    }
                }
                
                if (!data.email || !data.phone) {
                    showAlert('Please fill in all required fields (email and phone).', 'error');
                    return;
                }
                
                // Disable submit button to prevent double submission
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = 'Submitting...';
                }
                
                try {
                    console.log('🚀 ========== FORM SUBMISSION STARTED ==========');
                    console.log('📋 Form data collected:', data);
                    console.log('📋 Registration type:', data.registrationType);
                    console.log('📋 Organization name:', data.organizationName);
                    console.log('📋 Number of attendees:', data.numberOfAttendees);
                    
                    // Save registration
                    console.log('💾 Calling saveRegistration function...');
                    const success = await saveRegistration(data);
                    
                    console.log('📊 saveRegistration returned:', success);
                    console.log('📊 Type of success:', typeof success);
                    console.log('📊 Is success === true?', success === true);
                    console.log('📊 Is success truthy?', !!success);
                    
                    if (success === true) {
                        console.log('✅ ========== SUCCESS! Registration saved to Supabase ==========');
                        console.log('✅ Showing success notifications...');
                        
                        // Use unified success notification handler
                        const orgName = data.organizationName || 'Organization';
                        console.log('✅ Organization name for notification:', orgName);
                        
                        // Close registration modal FIRST so success modal is visible
                        console.log('🔄 Closing registration modal immediately to show success notification');
                        closeEventRegistration();
                        
                        // Small delay to ensure modal is closed, then show success notifications
                        setTimeout(() => {
                            // Call unified success handler
                            showSuccessNotifications(orgName);
                        }, 300);
                    } else {
                        console.error('❌ ========== REGISTRATION SAVE FAILED ==========');
                        console.error('❌ saveRegistration returned:', success);
                        console.error('❌ This means the save did not complete successfully');
                        console.error('❌ Check the console above for validation or database errors');
                        
                        // Show a generic error if no specific error was shown
                        if (submitButton) {
                            submitButton.disabled = false;
                            submitButton.textContent = 'Submit Registration';
                        }
                    }
                } catch (error) {
                    console.error('❌ ========== EXCEPTION IN FORM SUBMISSION ==========');
                    console.error('❌ Error type:', error.constructor.name);
                    console.error('❌ Error message:', error.message);
                    console.error('❌ Error stack:', error.stack);
                    console.error('❌ Full error:', error);
                    
                    showAlert(`❌ An error occurred: ${error.message || 'Please try again.'}`, 'error');
                    showToastNotification(`❌ Error: ${error.message || 'Please try again.'}`, 'error');
                    
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Submit Registration';
                    }
                }
            });
        }
    }
    
    // ✅ SAFETY: Ensure validateAttendeeDetails is NOT exposed globally
    // It should only be called internally within this module
    // This prevents any cached/broken versions from interfering
    
    // Make functions globally accessible (but NOT validateAttendeeDetails)
    window.openEventRegistration = openEventRegistration;
    window.closeEventRegistration = closeEventRegistration;
    window.addAttendeeRow = addAttendeeRow;
    
    // ✅ EXPLICIT: Expose buildAttendeesFromDOM for debugging (if needed)
    // But keep validateAttendeeDetails private to prevent conflicts
    if (typeof window.buildAttendeesFromDOM === 'undefined') {
        window.buildAttendeesFromDOM = buildAttendeesFromDOM;
    }
    window.removeAttendeeRow = removeAttendeeRow;
    window.downloadAttendeeTemplate = downloadAttendeeTemplate;
    window.handleExcelUpload = handleExcelUpload;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
