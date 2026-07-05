import os

path = r"d:\MMU\SE Fundementals\Assignment Part II\Software Engineering Website\Software Engineering Website\SmartHostel-TT6L\frontend\src\pages\AdminStaffDirectory.jsx"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if 'className="header-actions"' in line:
        new_lines.append(line)
        # Add new buttons
        new_lines.append(r'                        <button className="header-btn" onClick={() => navigate("/admin-settings")}>' + "\n")
        new_lines.append(r'                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">' + "\n")
        new_lines.append(r'                                <circle cx="12" cy="12" r="3"></circle>' + "\n")
        new_lines.append(r'                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' + "\n")
        new_lines.append(r'                            </svg>' + "\n")
        new_lines.append(r'                            Settings' + "\n")
        new_lines.append(r'                        </button>' + "\n")
        new_lines.append(r'                        <button className="header-btn" onClick={handleLogout}>' + "\n")
        new_lines.append(r'                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">' + "\n")
        new_lines.append(r'                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>' + "\n")
        new_lines.append(r'                                <polyline points="16 17 21 12 16 7"></polyline>' + "\n")
        new_lines.append(r'                                <line x1="21" y1="12" x2="9" y2="12"></line>' + "\n")
        new_lines.append(r'                            </svg>' + "\n")
        new_lines.append(r'                            Logout' + "\n")
        new_lines.append(r'                        </button>' + "\n")
        skip = True # skip until </div>
    elif skip:
        if line.strip() == "</div>":
             skip = False
             new_lines.append(line)
        # else skip
    else:
        new_lines.append(line)

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
