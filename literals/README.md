## Literals

The directory contains all the literals and their handlers that are used in the emails sent out. All the literal objects defined are ultimately of type `EmailLiterals`, which contains the properties `subject`, `body` and `greeting`, as needed for all the emails. The untyped exported `literal` object puts together all the initialized literals.
All the literals defined are as listed below.

- **Summary Literal** : Handles summary requests
- **Refund Literal** : Handles free day refund requests
  - _beyond_: refund requested date > possible policy date
  - _unused_: 0 days previously used
  - _recieved_: recieve acknowledgement
  - _approved_: successful approval acknowledgement
- **Request Literal** : Handles free days requests
  - _beyond_: requested date > deadline / possible policy date
  - _unused_: requested days < previously used (requested) days
  - _global_: requested days > possible remaining days (globally)
  - _approved_: successful approval acknowledgement
