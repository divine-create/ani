from fastapi import APIRouter
router = APIRouter()
# Approve actions are handled directly on their resource routes
# (POST /inbox/{id}/approve, POST /reviews/{id}/approve)
# This router is reserved for bulk approval endpoints
