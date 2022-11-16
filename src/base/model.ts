export enum Status {
	NORMAL = 'Normal',
	WARNING = 'Warning',
	ABNORMAL = 'Abnormal',
}

export enum PatientGranularity {
	DAY = 'day',
	WEEK = 'week',
	MONTH = 'month',
}

export enum DoctorGranularity {
	WEEK = 'week',
	MONTH = 'month',
	THREE_MONTHS = '3 months',
}

export type Granularity = PatientGranularity | DoctorGranularity
