#!/bin/bash

# Create database
psql -U postgres -c "CREATE DATABASE chemicaloop;" 2>/dev/null || echo "Database may already exist"

# Run migrations
psql -U postgres -d chemicaloop -f src/migrations/init.sql

echo "Database initialized!"
