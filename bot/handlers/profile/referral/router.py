# handlers/profile/referral/router.py
from aiogram import Router
from . import main

router = Router()
router.include_router(main.router)
