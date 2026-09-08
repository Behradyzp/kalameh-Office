#!/usr/bin/env bash
set -euo pipefail

npx vite build --config vite.cpanel.config.ts
cp -R cpanel-server/api cpanel-package/api
cp cpanel-server/install.php cpanel-package/install.php
cp cpanel-server/.htaccess cpanel-package/.htaccess
mkdir -p cpanel-package/storage/uploads
cp cpanel-server/storage/.htaccess cpanel-package/storage/.htaccess
cp cpanel-server/storage/index.html cpanel-package/storage/index.html
cp CPANEL_INSTALL.md cpanel-package/README-INSTALL.md
