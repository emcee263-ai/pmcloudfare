Fonts served by the site itself.

Inter (Regular, Medium, SemiBold, Bold, ExtraBold), trimmed to Latin characters.
Copyright The Inter Project Authors. Licensed under the SIL Open Font License 1.1 (https://openfontlicense.org).

Syne (the wide heading font) is loaded from Google Fonts by default.
To serve Syne from this site instead, so visitors never contact Google:
  1. Add these two files to this folder:
       Syne-Bold.woff2        (weight 700)
       Syne-ExtraBold.woff2   (weight 800)
     Get them from https://fonts.google.com/specimen/Syne or the Fontsource package "@fontsource/syne" (Latin subset).
  2. In Cloudflare, add the build variable NEXT_PUBLIC_SELF_HOST_SYNE = true, then deploy again.
Syne is licensed under the SIL Open Font License 1.1.
