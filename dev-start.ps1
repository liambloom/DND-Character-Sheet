wt --window 0 new-tab -d . -c Powershell `;`
    new-tab -d . --title "Database" -c psql -U liamr -d dnd5e `;`
    new-tab -d . --title "Script Nodemon" --suppressApplicationTitle -c cmd /c npm run listen-scripts `;`
    new-tab -d . --title "Server Nodemon" --suppressApplicationTitle -c cmd /c npm run listen-server