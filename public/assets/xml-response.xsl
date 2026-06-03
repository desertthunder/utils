<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>utility-api XML response</title>
        <style>
          :root {
            color-scheme: dark;
            --surface: #161616;
            --surface-raised: #262626;
            --border: #525252;
            --text: #f2f4f8;
            --muted: #a2a9b0;
            --accent: #33b1ff;
            --green: #42be65;
          }

          * { box-sizing: border-box; }

          body {
            margin: 0;
            padding: 2rem;
            background: var(--surface);
            color: var(--text);
            font-family: ui-sans-serif, system-ui, sans-serif;
            line-height: 1.6;
          }

          main {
            max-width: 72rem;
            margin-inline: auto;
          }

          h1 {
            margin: 0 0 0.5rem;
            font-size: clamp(2rem, 5vw, 4rem);
            line-height: 1;
          }

          p {
            margin: 0 0 1.5rem;
            color: var(--muted);
          }

          pre {
            overflow: auto;
            padding: 1.25rem;
            border: 1px solid var(--border);
            background: var(--surface-raised);
            color: var(--text);
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          .tag { color: var(--accent); }
          .text { color: var(--green); }
        </style>
      </head>
      <body>
        <main>
          <h1>XML Response</h1>
          <p>api.desertthunder.dev XML response</p>
          <pre><xsl:apply-templates /></pre>
        </main>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="*">
    <xsl:param name="indent" select="''" />
    <xsl:value-of select="$indent" />
    <span class="tag">&lt;<xsl:value-of select="name()" />&gt;</span>
    <xsl:choose>
      <xsl:when test="*">
        <xsl:text>&#10;</xsl:text>
        <xsl:apply-templates>
          <xsl:with-param name="indent" select="concat($indent, '  ')" />
        </xsl:apply-templates>
        <xsl:value-of select="$indent" />
        <span class="tag">&lt;/<xsl:value-of select="name()" />&gt;</span>
        <xsl:text>&#10;</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <span class="text"><xsl:value-of select="." /></span>
        <span class="tag">&lt;/<xsl:value-of select="name()" />&gt;</span>
        <xsl:text>&#10;</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
</xsl:stylesheet>
