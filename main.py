#!/usr/bin/env python3
"""Simple RotMG dungeon clear timer — start on entry, end on boss dead."""

from __future__ import annotations

import asyncio
import sqlite3
from datetime import datetime
from pathlib import Path

import flet as ft

DB_PATH = Path(__file__).resolve().parent / "times.db"

DUNGEONS = [
    "Lost Halls complex",
    "Kogbold Steamworks",
    "Moonlight Village",
    "Shatters",
]


def format_duration(seconds: float) -> str:
    total = int(round(seconds))
    hours, rem = divmod(total, 3600)
    minutes, secs = divmod(rem, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dungeon TEXT NOT NULL,
                started_at TEXT NOT NULL,
                duration_seconds REAL NOT NULL
            )
            """
        )


def save_run(dungeon: str, started_at: datetime, duration_seconds: float) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO runs (dungeon, started_at, duration_seconds) VALUES (?, ?, ?)",
            (dungeon, started_at.isoformat(timespec="seconds"), duration_seconds),
        )


def fetch_runs(dungeon: str | None = None) -> list[tuple]:
    query = "SELECT id, dungeon, started_at, duration_seconds FROM runs"
    params: tuple = ()
    if dungeon:
        query += " WHERE dungeon = ?"
        params = (dungeon,)
    query += " ORDER BY id DESC"
    with sqlite3.connect(DB_PATH) as conn:
        return conn.execute(query, params).fetchall()


def delete_run(run_id: int) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM runs WHERE id = ?", (run_id,))


def average_duration(dungeon: str) -> float | None:
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT AVG(duration_seconds), COUNT(*) FROM runs WHERE dungeon = ?",
            (dungeon,),
        ).fetchone()
    if not row or not row[1]:
        return None
    return row[0]


def main(page: ft.Page) -> None:
    init_db()

    page.title = "RotMG Dungeon Timer"
    page.window.width = 760
    page.window.height = 620
    page.padding = 20
    page.theme_mode = ft.ThemeMode.DARK

    state = {"start": None, "timer_task": None}

    dungeon_dropdown = ft.Dropdown(
        label="Dungeon",
        value=DUNGEONS[0],
        options=[ft.dropdown.Option(d) for d in DUNGEONS],
        width=320,
        disabled=False,
    )

    timer_text = ft.Text("—", size=56, weight=ft.FontWeight.BOLD)
    status_text = ft.Text("Pick a dungeon, then Start when you enter.", color=ft.Colors.GREY_400)
    average_text = ft.Text("", color=ft.Colors.GREY_400)

    start_btn = ft.ElevatedButton("Start", icon=ft.Icons.PLAY_ARROW, bgcolor=ft.Colors.GREEN_700)
    end_btn = ft.ElevatedButton("End", icon=ft.Icons.STOP, bgcolor=ft.Colors.RED_700, disabled=True)

    runs_table = ft.DataTable(
        columns=[
            ft.DataColumn(ft.Text("When")),
            ft.DataColumn(ft.Text("Dungeon")),
            ft.DataColumn(ft.Text("Time")),
            ft.DataColumn(ft.Text("")),
        ],
        rows=[],
        heading_row_color=ft.Colors.SURFACE_CONTAINER_HIGHEST,
        border=ft.border.all(1, ft.Colors.OUTLINE),
    )

    def update_average() -> None:
        avg = average_duration(dungeon_dropdown.value)
        runs = fetch_runs(dungeon_dropdown.value)
        if avg is None:
            average_text.value = f"No runs logged for {dungeon_dropdown.value} yet."
        else:
            average_text.value = (
                f"{dungeon_dropdown.value}: avg {format_duration(avg)} "
                f"over {len(runs)} run{'s' if len(runs) != 1 else ''}"
            )
        average_text.update()

    def refresh_table() -> None:
        rows = []
        for run_id, dungeon, started_at, duration in fetch_runs():
            when = datetime.fromisoformat(started_at).strftime("%Y-%m-%d %H:%M")
            rows.append(
                ft.DataRow(
                    cells=[
                        ft.DataCell(ft.Text(when)),
                        ft.DataCell(ft.Text(dungeon)),
                        ft.DataCell(ft.Text(format_duration(duration), weight=ft.FontWeight.W_600)),
                        ft.DataCell(
                            ft.IconButton(
                                icon=ft.Icons.DELETE_OUTLINE,
                                icon_size=18,
                                tooltip="Delete",
                                data=run_id,
                                on_click=on_delete,
                            )
                        ),
                    ]
                )
            )
        runs_table.rows = rows
        if runs_table.page:
            runs_table.update()
        update_average()

    async def tick_timer() -> None:
        while state["start"] is not None:
            elapsed = (datetime.now() - state["start"]).total_seconds()
            timer_text.value = format_duration(elapsed)
            timer_text.update()
            await asyncio.sleep(0.2)

    def stop_timer_task() -> None:
        task = state.get("timer_task")
        if task and not task.done():
            task.cancel()
        state["timer_task"] = None

    def on_start(_: ft.ControlEvent) -> None:
        if state["start"] is not None:
            return
        state["start"] = datetime.now()
        dungeon_dropdown.disabled = True
        start_btn.disabled = True
        end_btn.disabled = False
        status_text.value = f"Running — {dungeon_dropdown.value}"
        status_text.color = ft.Colors.GREEN_400
        timer_text.value = "0:00"
        state["timer_task"] = page.run_task(tick_timer)
        page.update()

    def on_end(_: ft.ControlEvent) -> None:
        if state["start"] is None:
            return
        started = state["start"]
        duration = (datetime.now() - started).total_seconds()
        dungeon = dungeon_dropdown.value
        save_run(dungeon, started, duration)
        stop_timer_task()
        state["start"] = None
        dungeon_dropdown.disabled = False
        start_btn.disabled = False
        end_btn.disabled = True
        timer_text.value = format_duration(duration)
        status_text.value = f"Saved — {format_duration(duration)}"
        status_text.color = ft.Colors.BLUE_400
        refresh_table()
        page.update()

    def on_delete(e: ft.ControlEvent) -> None:
        run_id = e.control.data
        delete_run(run_id)
        refresh_table()

    def on_dungeon_change(_: ft.ControlEvent) -> None:
        if state["start"] is None:
            update_average()

    start_btn.on_click = on_start
    end_btn.on_click = on_end
    dungeon_dropdown.on_change = on_dungeon_change

    page.add(
        ft.Text("RotMG Dungeon Timer", size=22, weight=ft.FontWeight.BOLD),
        ft.Text("Start when you enter the dungeon. End when the boss dies.", color=ft.Colors.GREY_400),
        ft.Row([dungeon_dropdown], alignment=ft.MainAxisAlignment.START),
        ft.Container(
            content=ft.Column(
                [timer_text, status_text, average_text],
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            ),
            padding=ft.padding.symmetric(vertical=16),
            alignment=ft.alignment.center,
        ),
        ft.Row([start_btn, end_btn], alignment=ft.MainAxisAlignment.CENTER, spacing=16),
        ft.Divider(),
        ft.Text("History", size=16, weight=ft.FontWeight.W_600),
        ft.Container(content=runs_table, expand=True),
    )

    refresh_table()


if __name__ == "__main__":
    ft.app(main)
