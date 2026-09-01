# Kindie Countdown

A bright, cheerful countdown site for a kindergarten classroom. It shows the days until the next big event, countdowns to every important day of the school year, and how much of the school year is done — all computed right in your browser using your device's clock.

## How to add or change days
Edit **`data.csv`** — one event per row, with four columns:

```
date,event,importance,no_school
2026-10-12,Thanksgiving,FALSE,TRUE
```

| Column | Meaning |
| --- | --- |
| `date` | The day of the event, as `YYYY-MM-DD` |
| `event` | The name shown on the page |
| `importance` | `TRUE` = show it in the "Big Important Days" section |
| `no_school` | `TRUE` = beginners can stay home ("No School" badge); `FALSE` = it's a school day |

The very first and very last rows are the first & last days of school; they anchor the school-year progress bar. Rows do not need to be sorted — the page sorts them for you.

## Hosting
Hosted with GitHub Pages from the `main` branch root.,

## License
MIT — see [`LICENSE`](LICENSE).