/**
 * TeamCustomizer - Handles the team creation customizer-style modal view and team metadata storage.
 */
var TeamCustomizer = (function () {
    var modalId = 'notum-team-create-modal';
    var selectedPrivacy = ''; // '' (unselected), 'public' or 'private'
    var invitedMembers = []; // Array of {name, email, initials}

    // ====== Collaborators Storage ======
    function getCollaborators() {
        try {
            var data = localStorage.getItem('team_collaborators');
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    }

    function saveCollaborators(list) {
        try {
            localStorage.setItem('team_collaborators', JSON.stringify(list));
        } catch (e) {}
    }

    function addCollaborators(members) {
        var existing = getCollaborators();
        members.forEach(function(m) {
            var found = existing.some(function(c) { 
                return c.email.toLowerCase() === m.email.toLowerCase(); 
            });
            if (!found && m.email) {
                existing.push({ name: m.name, email: m.email, initials: m.initials });
            }
        });
        saveCollaborators(existing);
    }

    function getInitials(name) {
        if (!name) return '??';
        var parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ====== Modal Open/Close ======
    function open() {
        var modal = document.getElementById(modalId);
        if (modal) {
            // Reset input values
            document.getElementById('new-team-name-input').value = '';
            document.getElementById('new-team-desc-input').value = '';
            document.getElementById('new-team-members-input').value = '';
            invitedMembers = [];
            selectedPrivacy = '';
            updatePrivacyUI();
            renderInviteChips();
            hideInviteDropdown();
            
            // Set manager details dynamically from Auth module
            var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
            var name = "Muhammet Alğan";
            var initials = "MA";
            var avatarUrl = "";

            if (user) {
                name = (user.firstName || '') + ' ' + (user.lastName || '');
                name = name.trim() || user.email || "Muhammet Alğan";
                
                var first = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
                var last = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
                initials = (first + last) || user.email.substring(0, 2).toUpperCase() || "MA";
                
                try {
                    avatarUrl = localStorage.getItem('avatar_' + user.email) || "";
                } catch(e) {}
            }

            // Update sidebar manager info
            var nameTextEl = document.getElementById('team-creator-name-text');
            if (nameTextEl) nameTextEl.textContent = name;
            
            var avatarEl = document.getElementById('team-creator-avatar-img');
            if (avatarEl) {
                if (avatarUrl) {
                    avatarEl.textContent = '';
                    avatarEl.style.backgroundImage = 'url(' + avatarUrl + ')';
                } else {
                    avatarEl.textContent = initials;
                    avatarEl.style.backgroundImage = '';
                }
            }

            // Update preview manager info
            var previewCreatorName = document.getElementById('team-creator-name-preview');
            if (previewCreatorName) previewCreatorName.textContent = name;

            var previewAvatarEl = document.getElementById('team-creator-avatar-preview');
            if (previewAvatarEl) {
                if (avatarUrl) {
                    previewAvatarEl.textContent = '';
                    previewAvatarEl.style.backgroundImage = 'url(' + avatarUrl + ')';
                    previewAvatarEl.style.backgroundSize = 'cover';
                    previewAvatarEl.style.backgroundPosition = 'center';
                } else {
                    previewAvatarEl.textContent = initials;
                    previewAvatarEl.style.backgroundImage = '';
                }
            }

            // Clear drop-down list
            hidePrivacyDropdown();

            // Show modal
            modal.style.display = 'flex';
            
            // Initial preview render
            updatePreview();

            // Focus on first input
            setTimeout(function() {
                document.getElementById('new-team-name-input').focus();
            }, 100);
        }
    }

    function close() {
        var modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
        hidePrivacyDropdown();
        hideInviteDropdown();
    }

    // ====== Privacy Dropdown ======
    function togglePrivacyDropdown(event) {
        if (event) event.stopPropagation();
        var dd = document.getElementById('team-privacy-dropdown');
        if (dd) {
            if (dd.style.display === 'flex') {
                dd.style.display = 'none';
            } else {
                dd.style.display = 'flex';
            }
        }
    }

    function hidePrivacyDropdown() {
        var dd = document.getElementById('team-privacy-dropdown');
        if (dd) dd.style.display = 'none';
    }

    function selectPrivacy(type) {
        selectedPrivacy = type;
        updatePrivacyUI();
        hidePrivacyDropdown();
        updatePreview();
    }

    function updatePrivacyUI() {
        var valEl = document.getElementById('team-privacy-selected-val');
        var iconEl = document.getElementById('team-privacy-selected-icon');
        var selectorEl = document.querySelector('.team-privacy-selector');

        var radioPublic = document.getElementById('team-privacy-radio-public');
        var radioPrivate = document.getElementById('team-privacy-radio-private');

        if (!selectedPrivacy) {
            if (selectorEl) selectorEl.classList.add('unselected');
            if (valEl) valEl.textContent = 'Gizliliği seç';
            if (iconEl) {
                iconEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
            }
            if (radioPublic) radioPublic.classList.remove('active');
            if (radioPrivate) radioPrivate.classList.remove('active');
        } else if (selectedPrivacy === 'public') {
            if (selectorEl) selectorEl.classList.remove('unselected');
            if (valEl) valEl.textContent = 'Herkese açık';
            if (iconEl) {
                iconEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
            }
            if (radioPublic) radioPublic.classList.add('active');
            if (radioPrivate) radioPrivate.classList.remove('active');
        } else {
            if (selectorEl) selectorEl.classList.remove('unselected');
            if (valEl) valEl.textContent = 'Üyelere özel';
            if (iconEl) {
                iconEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
            }
            if (radioPublic) radioPublic.classList.remove('active');
            if (radioPrivate) radioPrivate.classList.add('active');
        }
    }

    // ====== Invite Panel ======
    function openInvitePanel(event) {
        if (event) event.stopPropagation();
        var dd = document.getElementById('team-invite-dropdown');
        var input = document.getElementById('new-team-members-input');
        if (dd && dd.style.display !== 'block') {
            dd.style.display = 'block';
            renderSuggestions();
        }
        if (input) input.focus();
    }

    function hideInviteDropdown() {
        var dd = document.getElementById('team-invite-dropdown');
        if (dd) dd.style.display = 'none';
    }

    function renderSuggestions(filter) {
        var container = document.getElementById('team-invite-suggestions');
        var noResult = document.getElementById('team-invite-no-result');
        var headerEl = document.querySelector('.team-invite-dropdown-header');
        if (!container) return;

        container.innerHTML = '';
        var collaborators = getCollaborators();
        var query = (filter || '').toLowerCase().trim();

        // Filter collaborators
        var filtered = collaborators.filter(function(c) {
            if (!query) return true;
            return (c.name && c.name.toLowerCase().indexOf(query) !== -1) || 
                   (c.email && c.email.toLowerCase().indexOf(query) !== -1);
        });

        // Check if input is a valid email (for email invite action)
        var inputVal = document.getElementById('new-team-members-input');
        var typedEmail = inputVal ? inputVal.value.trim() : '';
        var showEmailAction = isValidEmail(typedEmail);
        var emailAlreadyInvited = invitedMembers.some(function(m) {
            return m.email.toLowerCase() === typedEmail.toLowerCase();
        });

        // Remove old email action if present
        var existingEmailAction = container.parentElement.querySelector('.team-invite-email-action');
        if (existingEmailAction) existingEmailAction.remove();

        if (filtered.length > 0) {
            if (headerEl) headerEl.style.display = '';
            if (noResult) noResult.style.display = 'none';

            filtered.forEach(function(c) {
                var isSelected = invitedMembers.some(function(m) {
                    return m.email.toLowerCase() === c.email.toLowerCase();
                });
                var item = document.createElement('div');
                item.className = 'team-invite-suggestion-item' + (isSelected ? ' selected' : '');
                item.innerHTML = 
                    '<div class="team-invite-suggestion-avatar">' + (c.initials || getInitials(c.name)) + '</div>' +
                    '<div class="team-invite-suggestion-info">' +
                    '  <span class="team-invite-suggestion-name">' + c.name + '</span>' +
                    '  <span class="team-invite-suggestion-email">' + c.email + '</span>' +
                    '</div>';
                if (!isSelected) {
                    item.onclick = function() {
                        addInvitedMember({ name: c.name, email: c.email, initials: c.initials || getInitials(c.name) });
                    };
                }
                container.appendChild(item);
            });
        } else {
            if (headerEl) headerEl.style.display = query ? 'none' : '';
            if (noResult) noResult.style.display = (showEmailAction || !query) ? 'none' : 'flex';
        }

        // Show email invite action if valid email typed
        if (showEmailAction && !emailAlreadyInvited) {
            var emailAction = document.createElement('div');
            emailAction.className = 'team-invite-email-action';
            emailAction.innerHTML = 
                '<div class="team-invite-email-icon">' +
                '  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
                '</div>' +
                '<div class="team-invite-email-text">' +
                '  <span class="team-invite-email-address">' + typedEmail + '</span>' +
                '  <span class="team-invite-email-hint">E-posta ile davet gönder</span>' +
                '</div>';
            emailAction.onclick = function() {
                addInvitedMember({ name: typedEmail.split('@')[0], email: typedEmail, initials: getInitials(typedEmail.split('@')[0]) });
            };
            container.parentElement.insertBefore(emailAction, noResult);
            if (noResult) noResult.style.display = 'none';
        }
    }

    function filterInviteSuggestions() {
        var input = document.getElementById('new-team-members-input');
        var query = input ? input.value.trim() : '';
        var dd = document.getElementById('team-invite-dropdown');
        if (dd && dd.style.display !== 'block') {
            dd.style.display = 'block';
        }
        renderSuggestions(query);

        // Handle Enter key for email invite
        input.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                var val = input.value.trim();
                if (isValidEmail(val)) {
                    var alreadyInvited = invitedMembers.some(function(m) {
                        return m.email.toLowerCase() === val.toLowerCase();
                    });
                    if (!alreadyInvited) {
                        addInvitedMember({ name: val.split('@')[0], email: val, initials: getInitials(val.split('@')[0]) });
                    }
                }
            }
            if (e.key === 'Backspace' && !input.value && invitedMembers.length > 0) {
                removeInvitedMember(invitedMembers.length - 1);
            }
        };
    }

    function addInvitedMember(member) {
        var alreadyExists = invitedMembers.some(function(m) {
            return m.email.toLowerCase() === member.email.toLowerCase();
        });
        if (alreadyExists) return;

        invitedMembers.push(member);
        var input = document.getElementById('new-team-members-input');
        if (input) input.value = '';
        renderInviteChips();
        renderSuggestions();
        updatePreview();
    }

    function removeInvitedMember(index) {
        invitedMembers.splice(index, 1);
        renderInviteChips();
        renderSuggestions();
        updatePreview();
    }

    function renderInviteChips() {
        var container = document.getElementById('team-invite-chips');
        if (!container) return;
        container.innerHTML = '';

        invitedMembers.forEach(function(m, idx) {
            var chip = document.createElement('div');
            chip.className = 'team-invite-chip';
            chip.innerHTML = 
                '<div class="team-invite-chip-avatar">' + m.initials + '</div>' +
                '<span>' + m.name + '</span>' +
                '<button class="team-invite-chip-remove" data-idx="' + idx + '">' +
                '  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                '</button>';
            chip.querySelector('.team-invite-chip-remove').onclick = function(e) {
                e.stopPropagation();
                removeInvitedMember(idx);
            };
            container.appendChild(chip);
        });
    }

    // ====== Preview Update ======
    function updatePreview() {
        var nameInput = document.getElementById('new-team-name-input');
        var descInput = document.getElementById('new-team-desc-input');

        var name = nameInput ? nameInput.value.trim() : '';
        var desc = descInput ? descInput.value.trim() : '';

        // Live update title
        var titleEl = document.getElementById('team-preview-name');
        if (titleEl) {
            titleEl.textContent = name || "Ekip Adı";
        }

        // Live update description
        var descEl = document.getElementById('team-preview-desc');
        if (descEl) {
            if (desc) {
                descEl.textContent = desc;
                descEl.style.fontStyle = 'normal';
            } else {
                descEl.textContent = '';
                descEl.style.fontStyle = 'normal';
            }
        }

        // Calculate total invited members count
        var totalMembers = 1 + invitedMembers.length;
        var memberCountText = totalMembers + ' üye';

        // Live update privacy badge
        var badgeText = document.getElementById('team-preview-privacy-text');
        var memberCountEl = document.getElementById('team-preview-member-count');
        var badgeIcon = document.getElementById('team-preview-privacy-badge');
        
        if (memberCountEl) {
            memberCountEl.textContent = ' · ' + memberCountText;
        }
        
        if (!selectedPrivacy) {
            if (badgeText) badgeText.textContent = 'Grup gizliliği';
            if (badgeIcon) {
                badgeIcon.style.background = 'transparent';
                badgeIcon.style.color = '#000000';
                badgeIcon.style.borderColor = 'transparent';
                var iconSvg = badgeIcon.querySelector('svg');
                if (iconSvg) {
                    iconSvg.outerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                }
            }
        } else if (selectedPrivacy === 'public') {
            if (badgeText) badgeText.textContent = 'Herkese Açık';
            if (badgeIcon) {
                badgeIcon.style.background = 'transparent';
                badgeIcon.style.color = '#000000';
                badgeIcon.style.borderColor = 'transparent';
                var iconSvg = badgeIcon.querySelector('svg');
                if (iconSvg) {
                    iconSvg.outerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                }
            }
        } else {
            if (badgeText) badgeText.textContent = 'Üyelere Özel';
            if (badgeIcon) {
                badgeIcon.style.background = 'transparent';
                badgeIcon.style.color = '#000000';
                badgeIcon.style.borderColor = 'transparent';
                var iconSvg = badgeIcon.querySelector('svg');
                if (iconSvg) {
                    iconSvg.outerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
                }
            }
        }

        // Live update invited list in preview
        var listEl = document.getElementById('team-preview-invited-list');
        if (listEl) {
            listEl.innerHTML = '';
            invitedMembers.forEach(function(member) {
                var item = document.createElement('div');
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.gap = '8px';
                item.innerHTML = 
                    '<div style="width: 28px; height: 28px; border-radius: 50%; background: var(--color-bg-subtle, #f1f5f9); color: var(--color-text-secondary); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; border: 1px solid var(--color-border-subtle);">' + member.initials + '</div>' +
                    '<div style="display: flex; flex-direction: column;">' +
                    '  <span style="font-size: 12px; font-weight: 500; color: var(--color-text);">' + member.name + '</span>' +
                    '  <span style="font-size: 10px; color: var(--color-text-tertiary);">Davet edildi</span>' +
                    '</div>';
                listEl.appendChild(item);
            });
        }
    }

    // ====== Create Team ======
    function createTeam() {
        var nameInput = document.getElementById('new-team-name-input');
        var descInput = document.getElementById('new-team-desc-input');

        var name = nameInput ? nameInput.value.trim() : '';
        var desc = descInput ? descInput.value.trim() : '';
        var membersStr = invitedMembers.map(function(m) { return m.name; }).join(', ');

        if (!name) {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Lütfen bir ekip ismi girin.', 'error');
            } else {
                alert('Lütfen bir ekip ismi girin.');
            }
            if (nameInput) nameInput.focus();
            return;
        }

        if (!selectedPrivacy) {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Lütfen bir gizlilik seçeneği belirleyin.', 'error');
            } else {
                alert('Lütfen bir gizlilik seçeneği belirleyin.');
            }
            return;
        }

        // Save invited members as collaborators for future suggestions
        if (invitedMembers.length > 0) {
            addCollaborators(invitedMembers);
        }

        // Close modal
        close();

        // Add item to sidebar workspace group using App module helper
        if (typeof App !== 'undefined' && App.addNewGroupItem) {
            App.addNewGroupItem('workspace', 'notes', name);
            
            var currentSection = localStorage.getItem('app_current_section');
            if (currentSection && currentSection.indexOf('team_instance_') === 0) {
                var metadata = {
                    id: currentSection,
                    name: name,
                    description: desc,
                    privacy: selectedPrivacy,
                    members: membersStr,
                    invitedMembers: invitedMembers,
                    createdAt: Date.now()
                };
                
                try {
                    localStorage.setItem('team_metadata_' + currentSection, JSON.stringify(metadata));
                } catch (e) {
                    console.error('Failed to save team metadata', e);
                }
            }

            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Ekip başarıyla oluşturuldu!', 'success');
            }

            setTimeout(function() {
                if (typeof Notes !== 'undefined' && Notes.openModal) {
                    Notes.openModal();
                }
            }, 300);
        } else {
            console.error('App.addNewGroupItem is not available.');
        }
    }

    // ====== Global Click Listeners ======
    document.addEventListener('click', function(e) {
        var selector = e.target.closest('.team-privacy-selector');
        if (!selector) {
            hidePrivacyDropdown();
        }

        var inviteField = e.target.closest('.team-invite-field');
        var inviteDropdown = e.target.closest('.team-invite-dropdown');
        if (!inviteField && !inviteDropdown) {
            hideInviteDropdown();
        }
    });

    return {
        open: open,
        close: close,
        togglePrivacyDropdown: togglePrivacyDropdown,
        selectPrivacy: selectPrivacy,
        updatePreview: updatePreview,
        createTeam: createTeam,
        openInvitePanel: openInvitePanel,
        filterInviteSuggestions: filterInviteSuggestions,
        addCollaborators: addCollaborators,
        getCollaborators: getCollaborators
    };
})();
