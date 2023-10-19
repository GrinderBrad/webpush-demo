aws s3 cp feedDist s3://activity-feed-bbcon/ --recursive
aws cloudfront create-invalidation --distribution-id E2PYXY00NPCODY --paths "/*"
