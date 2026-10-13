# Матрица traceability

| Requirement | Scenario                  | Data entity                 | Logic / interface                                                  | Integration   | Acceptance criteria |
| ----------- | ------------------------- | --------------------------- | ------------------------------------------------------------------ | ------------- | ------------------- |
| REQ-C-001   | SCN-001                   | Credentials                 | React UI                                                           | —             | AC-010              |
| REQ-C-002   | SCN-003, SCN-004          | Message                     | Текстовый фильтр                                                   | GREEN-API     | AC-004, AC-006      |
| REQ-C-003   | SCN-001                   | Credentials                 | API client configuration                                           | GREEN-API     | AC-001              |
| REQ-C-004   | SCN-002, SCN-003, SCN-004 | Chat, Message, Notification | CheckAccount, SendMessage, ReceiveNotification, DeleteNotification | GREEN-API MAX | AC-003–AC-007       |
| REQ-F-001   | SCN-001                   | Credentials                 | Credential form                                                    | GREEN-API     | AC-001              |
| REQ-F-002   | SCN-002                   | Chat                        | Phone validation                                                   | GREEN-API     | AC-002              |
| REQ-F-003   | SCN-002                   | Chat                        | CheckAccount adapter                                               | GREEN-API     | AC-003              |
| REQ-F-004   | SCN-003                   | Message                     | SendMessage adapter                                                | GREEN-API     | AC-004              |
| REQ-F-005   | SCN-004                   | Notification                | Long polling                                                       | GREEN-API     | AC-005              |
| REQ-F-006   | SCN-004                   | Notification, Message       | Notification parser                                                | GREEN-API     | AC-006              |
| REQ-F-007   | SCN-004                   | Notification                | DeleteNotification adapter                                         | GREEN-API     | AC-007              |
| REQ-F-008   | SCN-005                   | Credentials                 | Session cleanup and abort                                          | GREEN-API     | AC-008              |
| REQ-F-009   | SCN-001–SCN-004           | Chat, Message, Notification | Error mapping                                                      | GREEN-API     | AC-009              |
| REQ-NF-001  | SCN-002–SCN-004           | —                           | Mocked API tests                                                   | GREEN-API     | AC-010              |
| REQ-NF-002  | SCN-001                   | Credentials                 | `.gitignore` and in-memory state                                   | Local project | AC-011              |
| REQ-NF-003  | SCN-001–SCN-003           | —                           | Accessible forms                                                   | React UI      | AC-012              |
| REQ-NF-004  | SCN-006                   | —                           | Theme state and color tokens                                       | React UI      | AC-013              |

Все сценарии связаны с требованиями; каждая внешняя операция связана с интерфейсом API и требованием.
