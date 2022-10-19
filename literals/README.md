## Literals
The directory contains all the literals that are used in emails sent out. The `LiteralType` contains a type with `subject`, `body` and `greeting` (optional) as needed for all the emails. All the `literal` Objects defined to handle the different possible responses are as listed below.
- __Summary Literal__ : Handles summary requests
- __Refund Literal__ : Handles free day refund requests
    - _beyond_: refund requested date > possible policy date
    - _unused_: 0 days previously used
    - _recieved_: recieve acknowledgement
    - _approved_: successful approval acknowledgement
- __Request Literal__ : Handles free days requests
    - _beyond_: requested date > deadline / possible policy date
    - _unused_: requested days < previously used (requested) days
    - _global_: requested days > possible remaining days (globally)
    - _approved_: successful approval acknowledgement
