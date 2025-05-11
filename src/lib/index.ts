// place files you want to import through the `$lib` alias in this folder.
export async function convertFileToBytea(file: File) {

  if (!file) {
    throw new Error('No file selected');
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);


  return uint8Array;
}
export function getCurrentDateTime() {
  const now = new Date();

  // Get date components
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
  const day = String(now.getDate()).padStart(2, '0');

  // Get time components
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Format the date and time string
  const formattedDateTime = `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
  // Example output: "2023-10-27 14:35:02"

  // You can also return them separately or as an object:
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}:${seconds}`,
    fullDateTime: formattedDateTime,
    dateObject: now // The original Date object if you need more operations
  };
}
// Define the interface for individual record items based on the provided schema
interface RecordItem {
  recordId: number;
  caseType?: string | null;
  caseNo: number;
  datePickup?: string | null;      // Expected format: "YYYY-MM-DD"
  timePickup?: string | null;      // Expected format: "HH:MM:SS" or "HH:MM"
  dateDropoff?: string | null;     // Expected format: "YYYY-MM-DD"
  timeDropoff?: string | null;     // Expected format: "HH:MM:SS" or "HH:MM"
  doctorName: string;
  clinicName: string;
  patientName: string;
  description?: string | null;
  totalAmount?: string | null;     // Decimals typically handled as strings to preserve precision
  paidAmount?: string | null;
  excessPayment?: string | null;
  createdAt: Date | string;       // Can be a JavaScript Date object or an ISO8601 string
  remarks?: string | null;
}

// Define the interface for the function's result
interface DateRangeResult {
  startingDate: Date | null;
  recentDate: Date | null;
}

/**
 * Calculates the earliest (starting) and most recent date from an array of records.
 * It considers datePickup (with timePickup), dateDropoff (with timeDropoff),
 * and createdAt fields from each record.
 *
 * @param records An array of RecordItem objects.
 * @returns An object containing the startingDate and recentDate as Date objects,
 * or null for either if no valid dates are found or the input array is empty.
 */
export function getRecordDateRange(records: RecordItem[]): DateRangeResult {
  if (!records || records.length === 0) {
    return { startingDate: null, recentDate: null };
  }

  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const record of records) {
    const candidateDatesFromRecord: Date[] = [];

    // Helper function to parse a direct date value (like createdAt)
    // It accepts a Date object or a string to be parsed.
    const processDirectDateValue = (dateValue: string | Date | undefined | null) => {
      if (dateValue) {
        const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
        // Check if the created Date object is valid
        if (dateObj && !isNaN(dateObj.getTime())) {
          candidateDatesFromRecord.push(dateObj);
        }
      }
    };

    // Helper function to combine a date string and a time string, then parse
    const processCombinedDateTime = (
      dateStr: string | undefined | null,
      timeStr: string | undefined | null
    ) => {
      if (dateStr) {
        let dateTimeStringForParsing = dateStr; // Start with the date part

        if (timeStr) {
          // Basic validation for HH:MM:SS or HH:MM time format
          if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
            dateTimeStringForParsing += `T${timeStr}`; // Append time if valid
          } else {
            // Log a warning if time format is unexpected and proceed with date only.
            // When only a date string "YYYY-MM-DD" is parsed by new Date(),
            // it's interpreted as UTC midnight.
            console.warn(
              `Invalid time format "${timeStr}" for date "${dateStr}". Using date part only.`
            );
          }
        }

        // new Date("YYYY-MM-DD") is parsed as UTC midnight.
        // new Date("YYYY-MM-DDTHH:MM:SS") is parsed as local time if no 'Z' (UTC) or timezone offset is specified in the string.
        // This is standard JavaScript Date behavior. All resulting Date objects
        // represent a specific moment in time (internally UTC milliseconds since epoch)
        // and are therefore directly comparable.
        const dateObj = new Date(dateTimeStringForParsing);
        if (dateObj && !isNaN(dateObj.getTime())) {
          candidateDatesFromRecord.push(dateObj);
        }
      }
    };

    // 1. Process the 'createdAt' field
    processDirectDateValue(record.createdAt);

    // 2. Process 'datePickup' and 'timePickup'
    processCombinedDateTime(record.datePickup, record.timePickup);

    // 3. Process 'dateDropoff' and 'timeDropoff'
    processCombinedDateTime(record.dateDropoff, record.timeDropoff);

    // Update the overall minDate and maxDate using valid dates found in the current record
    for (const currentDate of candidateDatesFromRecord) {
      if (minDate === null || currentDate < minDate) {
        minDate = currentDate;
      }
      if (maxDate === null || currentDate > maxDate) {
        maxDate = currentDate;
      }
    }
  }

  return { startingDate: minDate, recentDate: maxDate };
}

export function formatDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${month}-${day}-${year}`;
}
interface RecordsSummary {
  grandTotalAmount: number;    // Sum of all totalAmounts
  totalPaidAmount: number;     // Sum of all paidAmounts
  totalBalance: number;        // grandTotalAmount - totalPaidAmount
  financialStatus: 'Paid' | 'Unpaid' | 'N/A'; // Overall financial status
  processStatus: 'Processed' | 'On going' | 'Partially Processed' | 'N/A'; // Overall process status
}

export function generateRecordsSummary(records: RecordItem[]): RecordsSummary {
  // Handle empty or null input array
  if (!records || records.length === 0) {
    return {
      grandTotalAmount: 0,
      totalPaidAmount: 0,
      totalBalance: 0,
      financialStatus: 'N/A', // Not Applicable
      processStatus: 'N/A',   // Not Applicable
    };
  }

  let sumGrandTotalAmount = 0;
  let sumTotalPaidAmount = 0;

  let allRecordsAreConsideredPaid = true; // Assume all are paid until an unpaid one is found
  let isAnyRecordPending = false;         // Flag to check if any record is 'Pending'
  let areAllRecordsFinished = true;       // Assume all are finished until a non-finished one is found

  // Helper function to safely parse string amounts to numbers, defaulting to 0
  const getSafeNumber = (value: string | null | undefined): number => {
    if (value === null || value === undefined || typeof value !== 'string') {
      return 0;
    }
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num; // If parsing fails (NaN), treat as 0
  };

  for (const record of records) {
    const currentTotalAmount = getSafeNumber(record.totalAmount);
    const currentPaidAmount = getSafeNumber(record.paidAmount);

    sumGrandTotalAmount += currentTotalAmount;
    sumTotalPaidAmount += currentPaidAmount;

    // Determine if this specific record is unpaid
    // Using a small epsilon for floating point comparisons, though direct > 0 might be fine
    // if inputs are well-controlled decimals.
    if (currentTotalAmount - currentPaidAmount > 0.001) {
      allRecordsAreConsideredPaid = false;
    }

    // Check the individual processing status of the record
    if (record.remarks === 'pending') {
      isAnyRecordPending = true;
    }

    // If any record is not 'Finished', then the overall status cannot be 'Processed'
    // This also correctly handles cases where remarks is undefined or has another value.
    if (record.remarks !== 'finished') {
      areAllRecordsFinished = false;
    }
  }

  const finalTotalBalance = sumGrandTotalAmount - sumTotalPaidAmount;

  // Determine final financial status
  const finalFinancialStatus: 'Paid' | 'Unpaid' = allRecordsAreConsideredPaid ? 'Paid' : 'Unpaid';

  // Determine final process status
  let finalProcessStatus: 'Processed' | 'On going' | 'Partially Processed';
  if (isAnyRecordPending) {
    finalProcessStatus = 'On going'; // If any record is pending, the overall process is 'On going'
  } else if (areAllRecordsFinished) {
    // If no records are pending AND all records are marked as 'Finished'
    finalProcessStatus = 'Processed';
  } else {
    // If no records are pending, but not all records are 'Finished'
    finalProcessStatus = 'Partially Processed';
  }

  return {
    grandTotalAmount: sumGrandTotalAmount,
    totalPaidAmount: sumTotalPaidAmount,
    totalBalance: finalTotalBalance,
    financialStatus: finalFinancialStatus,
    processStatus: finalProcessStatus,
  };
}