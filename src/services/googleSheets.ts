import { WaterLogEntry } from '../types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

export const SPREADSHEET_TITLE = '💧 Water Hydration Log (Desktop Companion)';
export const SHEET_NAME = 'Hydration Logs';

export const SHEET_HEADERS = [
  'Timestamp',
  'Date',
  'Time',
  'Intake Amount (ml)',
  'Daily Total (ml)',
  'Daily Goal (ml)',
  'Goal Progress (%)',
  'Log Type',
  'Character Note',
];

export async function fetchUserInfo(accessToken: string) {
  try {
    const res = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return await res.json();
  } catch (err) {
    console.error('Error fetching user info:', err);
    return null;
  }
}

/**
 * Searches for an existing Water Hydration Log spreadsheet in user's Google Drive.
 */
export async function findExistingSpreadsheet(accessToken: string): Promise<{ id: string; url: string; name: string } | null> {
  try {
    const query = encodeURIComponent(
      `name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    );
    const url = `${DRIVE_API_BASE}?q=${query}&fields=files(id, name, webViewLink)&pageSize=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      const file = data.files[0];
      return {
        id: file.id,
        url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
        name: file.name,
      };
    }
    return null;
  } catch (err) {
    console.warn('Could not search Drive files, will create new sheet:', err);
    return null;
  }
}

/**
 * Creates and formats a new Water Hydration Google Spreadsheet.
 */
export async function createHydrationSpreadsheet(accessToken: string): Promise<{ id: string; url: string }> {
  const payload = {
    properties: {
      title: SPREADSHEET_TITLE,
    },
    sheets: [
      {
        properties: {
          title: SHEET_NAME,
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 10,
          },
        },
      },
    ],
  };

  const createRes = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write and format header row
  await setupSpreadsheetHeader(accessToken, spreadsheetId);

  return { id: spreadsheetId, url: spreadsheetUrl };
}

/**
 * Sets up header row and cute styling for the sheet.
 */
async function setupSpreadsheetHeader(accessToken: string, spreadsheetId: string) {
  // 1. Add Header row values
  const range = `${SHEET_NAME}!A1:I1`;
  const appendUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  await fetch(appendUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [SHEET_HEADERS],
    }),
  });

  // 2. Format header with soft ocean-blue background and bold white text
  try {
    const formatPayload = {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: SHEET_HEADERS.length,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.08, green: 0.52, blue: 0.88, alpha: 1 }, // Ocean Sky Blue
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1, alpha: 1 },
                  fontSize: 11,
                  bold: true,
                },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: 0,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: SHEET_HEADERS.length,
            },
          },
        },
      ],
    };

    await fetch(`${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formatPayload),
    });
  } catch (err) {
    console.warn('Non-fatal header formatting error:', err);
  }
}

/**
 * Appends a list of water log entries to the Google Sheet.
 */
export async function appendWaterLogsToSheet(
  accessToken: string,
  spreadsheetId: string,
  entries: WaterLogEntry[]
): Promise<boolean> {
  if (!entries || entries.length === 0) return true;

  const rows = entries.map((entry) => {
    const pct = entry.dailyGoal > 0 ? `${Math.min(100, Math.round((entry.totalDailySoFar / entry.dailyGoal) * 100))}%` : '0%';
    const typeLabel =
      entry.type === 'yes_100'
        ? 'Yes (+100ml)'
        : entry.type === 'snooze_logged'
        ? 'Snooze Logged'
        : entry.type === 'quick_log'
        ? `Quick Log (+${entry.amount}ml)`
        : `Custom (+${entry.amount}ml)`;

    const dateFormatted = entry.date;
    const timeFormatted = entry.time;
    const timestampFormatted = new Date(entry.timestamp).toLocaleString();

    return [
      timestampFormatted,
      dateFormatted,
      timeFormatted,
      entry.amount,
      entry.totalDailySoFar,
      entry.dailyGoal,
      pct,
      typeLabel,
      entry.note || 'Hydrated with Desktop Companion',
    ];
  });

  const range = `${SHEET_NAME}!A:I`;
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Google Sheets API Error (${res.status}): ${errorBody}`);
  }

  return true;
}

/**
 * Fetches recent logs directly from the Google Sheet.
 */
export async function fetchSheetLogs(accessToken: string, spreadsheetId: string) {
  try {
    const range = `${SHEET_NAME}!A2:I100`;
    const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.values || [];
  } catch (err) {
    console.error('Error fetching sheet logs:', err);
    return null;
  }
}

/**
 * Clears data rows in the spreadsheet with destructive warning confirmation.
 */
export async function clearSheetDataRows(accessToken: string, spreadsheetId: string) {
  const range = `${SHEET_NAME}!A2:I1000`;
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to clear sheet data: ${errText}`);
  }
  return true;
}
