/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Google Drive API v3 helpers for client-side integration.
 */

export interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

/**
 * Lists all spreadsheet files in the user's Google Drive.
 */
export async function listDriveSpreadsheets(token: string): Promise<DriveFile[]> {
  if (!token) return [];

  try {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink,modifiedTime)&orderBy=modifiedTime desc&pageSize=30`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Impossible de lister vos fichiers Google Sheets.");
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error("List sheets from drive error:", error);
    throw error;
  }
}

/**
 * Creates a brand new spreadsheet in Google Drive.
 */
export async function createNewSpreadsheetOnDrive(token: string, name: string): Promise<DriveFile> {
  if (!token) throw new Error("Accès refusé. Token manquant.");

  try {
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink,modifiedTime',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          mimeType: 'application/vnd.google-apps.spreadsheet'
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Impossible de créer le fichier sur Google Drive.");
    }

    return await response.json();
  } catch (error) {
    console.error("Create sheet on drive error:", error);
    throw error;
  }
}

/**
 * Backs up the local data to a JSON backup file in Google Drive.
 * Checks if the file 'ongd_debout_grands_lacs_backup.json' exists.
 * If yes, overwrites it with latest data. If no, creates it.
 */
export async function backupDatabaseToDrive(
  token: string,
  backupData: any,
  fileName: string = 'ongd_debout_grands_lacs_backup.json'
): Promise<{ success: boolean; message: string; file?: DriveFile }> {
  if (!token) return { success: false, message: "Token Google manquant." };

  try {
    // 1. Search if the backup file already exists
    const q = encodeURIComponent(`name='${fileName}' and trashed=false`);
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      const err = await searchResponse.json();
      throw new Error(err.error?.message || "Recherche de sauvegarde sur Google Drive impossible.");
    }

    const searchData = await searchResponse.json();
    const existingFiles: DriveFile[] = searchData.files || [];

    let fileId = '';
    let name = fileName;

    if (existingFiles.length > 0) {
      // Use existing file ID
      fileId = existingFiles[0].id;
      name = existingFiles[0].name;
    } else {
      // Create new metadata entry
      const createResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files?fields=id,name',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: fileName,
            mimeType: 'application/json',
            description: 'Sauvegarde automatique des bénéficiaires et crédits de l\'ONGD Debout Grands Lacs'
          })
        }
      );

      if (!createResponse.ok) {
        const err = await createResponse.json();
        throw new Error(err.error?.message || "Création de la sauvegarde sur Google Drive impossible.");
      }

      const newFile = await createResponse.json();
      fileId = newFile.id;
    }

    // 2. Upload file content
    const contentBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: contentBlob
      }
    );

    if (!uploadResponse.ok) {
      const err = await uploadResponse.json();
      throw new Error(err.error?.message || "Transfert des données de sauvegarde échoué.");
    }

    // Retrieve full information
    const fileInfoResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink,modifiedTime`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const updatedFileInfo = await fileInfoResponse.json();

    return {
      success: true,
      message: `Sauvegarde synchronisée avec succès dans votre Google Drive sous le fichier "${name}".`,
      file: updatedFileInfo
    };
  } catch (error: any) {
    console.error("Backup to drive error:", error);
    return {
      success: false,
      message: error.message || String(error)
    };
  }
}

/**
 * Restores the local database from a JSON backup file in Google Drive.
 */
export async function restoreDatabaseFromDrive(
  token: string,
  fileName: string = 'ongd_debout_grands_lacs_backup.json'
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!token) return { success: false, message: "Token Google manquant." };

  try {
    // 1. Search for first matching backup file
    const q = encodeURIComponent(`name='${fileName}' and trashed=false`);
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      const err = await searchResponse.json();
      throw new Error(err.error?.message || "Recherche de la sauvegarde échouée.");
    }

    const searchData = await searchResponse.json();
    const files: DriveFile[] = searchData.files || [];

    if (files.length === 0) {
      return {
        success: false,
        message: `Aucune sauvegarde nommée "${fileName}" trouvée sur votre compte Google Drive.`
      };
    }

    const fileId = files[0].id;

    // 2. Fetch file content media
    const contentResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!contentResponse.ok) {
      throw new Error("Impossible de lire le contenu du fichier de sauvegarde.");
    }

    const backupData = await contentResponse.json();
    return {
      success: true,
      message: "Sauvegarde récupérée avec succès depuis votre Google Drive !",
      data: backupData
    };
  } catch (error: any) {
    console.error("Restore from drive error:", error);
    return {
      success: false,
      message: error.message || String(error)
    };
  }
}
