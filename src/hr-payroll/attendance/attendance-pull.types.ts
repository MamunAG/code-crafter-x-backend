export enum AttendancePullMethod {
  Get = 'GET',
  Post = 'POST',
}

export enum AttendanceSecretLocation {
  Header = 'HEADER',
  Query = 'QUERY',
  Body = 'BODY',
}

export type AttendancePullTargetField =
  | 'externalEventId'
  | 'employeeId'
  | 'employeeCode'
  | 'punchedAt'
  | 'direction'
  | 'deviceIdentifier'
  | 'metadata';

export type AttendancePullFieldMapping = {
  sourcePath: string;
  targetField: AttendancePullTargetField;
};

export type AttendancePullRequestConfig = {
  headers: Record<string, unknown>;
  query: Record<string, unknown>;
  body?: unknown;
  secret?: {
    location: AttendanceSecretLocation;
    key: string;
    value: string;
  };
};
