# PythonOku SEO and domain setup

The frontend is ready for indexing, but Google can only index the real site after `pythonoku.edu.kg` opens the Vercel frontend instead of the AWS API text.

## 1. Vercel domain

In Vercel:

1. Open the `python-oku-frontend` project.
2. Go to `Settings` -> `Domains`.
3. Add `pythonoku.edu.kg`.
4. Add `www.pythonoku.edu.kg` too, if Vercel recommends it.
5. Copy the DNS records Vercel shows for the domain.

## 2. Cloudflare DNS

In Cloudflare DNS, keep AWS only for the API subdomain:

```text
api.pythonoku.edu.kg  -> AWS EC2 public IPv4
```

Point the public website to Vercel using the exact records Vercel shows. Usually this is:

```text
pythonoku.edu.kg      -> Vercel apex record
www.pythonoku.edu.kg  -> Vercel CNAME record
```

Do not point `pythonoku.edu.kg` to the AWS backend. If `https://pythonoku.edu.kg/` shows `PythonOku API is running`, DNS is still going to AWS and Google will not index the frontend site.

## 3. Vercel environment variable

Set this in the Vercel project:

```env
VITE_API_BASE_URL=https://api.pythonoku.edu.kg/api/
```

Redeploy after changing it.

## 4. Google Search Console

After `https://pythonoku.edu.kg/` opens the Vercel frontend:

1. Open Google Search Console.
2. Add a Domain property for `pythonoku.edu.kg`.
3. Verify the domain with the TXT record Google gives you.
4. Submit this sitemap:

```text
https://pythonoku.edu.kg/sitemap.xml
```

5. Use URL Inspection for `https://pythonoku.edu.kg/` and request indexing.

Indexing can take from several hours to several days. A sitemap helps discovery, but it does not guarantee immediate indexing or ranking.