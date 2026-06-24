# Entity-Relationship Diagram

This document contains the ER diagram for the Attendance Management System in
Mermaid syntax. Paste it into [mermaid.live](https://mermaid.live) to render,
or view it directly on GitHub (which renders Mermaid blocks natively).

```mermaid
erDiagram
    USER ||--o{ CLASSSESSION : "teaches (as teacher)"
    USER }o--o{ CLASSSESSION : "enrolled in (as student)"
    USER ||--o{ ATTENDANCE : "marks (as teacher)"
    USER }o--o{ SUBJECT : "enrolled in"
    USER ||--o| SUBJECT : "assigned to teach"
    USER }o--|| DEPARTMENT : "belongs to"

    DEPARTMENT ||--o{ SUBJECT : "offers"
    DEPARTMENT ||--o{ CLASSSESSION : "hosts"

    SUBJECT ||--o{ CLASSSESSION : "taught via"
    SUBJECT ||--o{ ATTENDANCE : "tracked for"

    CLASSSESSION ||--o{ ATTENDANCE : "has daily records"

    USER {
        ObjectId _id PK
        string name
        string email
        string password
        string role
        string rollNumber
        ObjectId department FK
        ObjectId[] subjects FK
        boolean isActive
        date lowAttendanceAlertSentAt
    }

    DEPARTMENT {
        ObjectId _id PK
        string name
        string code
        string description
        ObjectId headOfDepartment FK
    }

    SUBJECT {
        ObjectId _id PK
        string name
        string code
        ObjectId department FK
        number semester
        ObjectId teacher FK
        number credits
    }

    CLASSSESSION {
        ObjectId _id PK
        string name
        ObjectId subject FK
        ObjectId teacher FK
        ObjectId department FK
        ObjectId[] students FK
        string schedule
        boolean isActive
    }

    ATTENDANCE {
        ObjectId _id PK
        ObjectId classSession FK
        ObjectId subject FK
        ObjectId teacher FK
        date date
        array records
    }
```

## Notes on the schema design

- **`ATTENDANCE.records`** is an embedded array (`{ student, status, remarks }`)
  rather than one document per student per day. This keeps one document per
  class-session-per-date, which is far cheaper to write and query in MongoDB
  than thousands of single-student documents.
- **`USER`** is a single collection with a `role` discriminator
  (`admin` / `teacher` / `student`) rather than three separate collections.
  Role-specific fields (`rollNumber`, `subjects`) are simply unused/null for
  roles that don't need them — this is idiomatic for MongoDB's flexible schema
  and avoids complex polymorphic joins.
- **`CLASSSESSION`** represents a teacher-created class/section (e.g. "CSE-3A"
  studying "Data Structures"). It is the join point between a `SUBJECT`, a
  `TEACHER`, and a roster of `STUDENT`s — attendance is always marked against
  a `CLASSSESSION` + date.
- A compound unique index on `ATTENDANCE (classSession, date)` prevents
  duplicate attendance records for the same class on the same day; marking
  attendance again for that day **upserts** the existing record instead of
  creating a duplicate.
