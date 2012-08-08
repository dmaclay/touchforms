#! /bin/bash

curl -X POST http://localhost:4444 \
    -H content-type:text/json \
    -d "{
            \"action\": \"answer\",
            \"session-id\": \"20335ac5-0b74-4c0d-b356-02cd82eb47a6\",
            \"answer\": \"1\"
        }"


