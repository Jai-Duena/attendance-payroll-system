; ============================================================================
; FCH Bio Sync — Inno Setup Installer Script
; Compile with Inno Setup 6 (https://jrsoftware.org/isinfo.php)
; Run build.bat first to produce dist\FCHBioSync\ before compiling this.
; ============================================================================

#define AppName      "FCH Bio Sync"
#define AppVersion   "1.0"
#define AppPublisher "Family Care Hospital"
#define AppExeName   "FCHBioSync.exe"
#define AppDir       "dist\FCHBioSync"

[Setup]
AppId={{FCH-BIO-SYNC-APP-2026-V1}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL=https://familycarehospital.ct.ws
AppSupportURL=https://familycarehospital.ct.ws
DefaultDirName={autopf}\FamilyCareBioSync
DefaultGroupName={#AppName}
AllowNoIcons=yes
; Create uninstaller
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
OutputDir=installer_output
OutputBaseFilename=FamilyCareBioSync_Setup_v{#AppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
; Require 64-bit Windows
ArchitecturesInstallIn64BitMode=x64os
MinVersion=10.0
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon";    Description: "{cm:CreateDesktopIcon}";    GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startmenuicon";  Description: "Create a Start Menu shortcut"; GroupDescription: "Shortcuts"; Flags: checkedonce
Name: "autostart";      Description: "Start FCH Bio Sync automatically when Windows starts"; GroupDescription: "Startup"; Flags: unchecked

[Files]
; Bundle everything from the PyInstaller output directory
Source: "{#AppDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Start Menu
Name: "{group}\{#AppName}";             Filename: "{app}\{#AppExeName}"
Name: "{group}\Uninstall {#AppName}";   Filename: "{uninstallexe}"
; Desktop (optional)
Name: "{autodesktop}\{#AppName}";       Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
; Offer to launch after install
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#AppName}}"; Flags: nowait postinstall skipifsilent

[Registry]
; Auto-start toggle (only when the user ticked the task above)
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; \
  ValueType: string; ValueName: "FCHBioSync"; \
  ValueData: """{app}\{#AppExeName}"" --minimized"; \
  Flags: uninsdeletevalue; Tasks: autostart

[UninstallDelete]
; Clean up after uninstall
Type: filesandordirs; Name: "{app}"

[Code]
// Optional: Show a note about config being kept in %APPDATA%
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
    MsgBox(
      'FCH Bio Sync has been uninstalled.' + #13#10 +
      'Your configuration and sync logs are kept in:' + #13#10 +
      ExpandConstant('{userappdata}\FamilyCareBioSync') + #13#10 +
      'Delete that folder manually if you wish to remove all app data.',
      mbInformation, MB_OK
    );
end;
