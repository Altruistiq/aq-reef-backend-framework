npm run build
git checkout releases
git merge main
cp -R pkg/* .
git add .
git commit -m "fix: testing releases"

