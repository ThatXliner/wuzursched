# Wuzursched

![](./logo.svg)

Wuzursched (pronounced [`/wʌzjɜskɛd/`](http://ipa-reader.xyz/?text=wʌzjɜskɛd), "wuzz-yer-sked") is a website for sharing your schedules and viewing others, making comparing schedules a breeze.

## Current limitations

- Good/strict class normalization is a long-term goal.

## Development

1. `git clone`
2. Install supabase CLI and run `supabase start`
3. Run `supabase db reset`
4. `supabase status --output env | node convert_env.js > .env`
5. Load that `.env` somehow
6. `pnpm run dev`

## Building

```bash
pnpm run build
```

You can preview the production build with `pnpm run preview`.
