/*
 * VERCEL FUNCTION
 * Endpoint browser:
 *   POST /api/apps-script
 *
 * Environment Variables yang wajib dibuat di Vercel:
 *   APPS_SCRIPT_URL
 *   APPS_SCRIPT_SECRET
 */

const ALLOWED_ACTIONS =
  new Set([
    'login',
    'getDashboardData',
    'mulaiIzin',
    'sudahKembali',
    'gantiPassword',
    'adminHapusJamIzin',
    'adminTambahLogin',
    'adminHapusLogin',
    'adminSetJabatan',
    'adminSetBatasHarian',
    'adminSetDurasi',
    'adminSetOverride',
    'adminHapusOverride',
    'adminAktifkanArsip',
    'adminGetIpSettings',
    'adminTambahIp',
    'adminHapusIp',
    'adminSetIpRestriction'
  ]);


function jsonResponse(
  body,
  status = 200
) {
  return Response.json(
    body,
    {
      status,

      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate',

        'Pragma':
          'no-cache'
      }
    }
  );
}


function getClientIp(
  request
) {
  /*
   * Vercel recommends x-vercel-forwarded-for as a
   * client-IP header. It is preferred over user input.
   */
  const raw =
    request.headers.get(
      'x-vercel-forwarded-for'
    ) ||
    request.headers.get(
      'x-real-ip'
    ) ||
    request.headers.get(
      'x-forwarded-for'
    ) ||
    '';

  return String(
    raw || ''
  )
    .split(',')[0]
    .trim();
}


export default {
  async fetch(request) {
    if (
      request.method !==
      'POST'
    ) {
      return jsonResponse(
        {
          ok: false,
          __apiError: true,
          message:
            'Method tidak diizinkan.'
        },
        405
      );
    }

    const appsScriptUrl =
      process.env
        .APPS_SCRIPT_URL;

    const appsScriptSecret =
      process.env
        .APPS_SCRIPT_SECRET;

    if (
      !appsScriptUrl ||
      !appsScriptSecret
    ) {
      return jsonResponse(
        {
          ok: false,
          __apiError: true,
          message:
            'Environment Variable Vercel belum lengkap.'
        },
        500
      );
    }

    let requestBody;

    try {
      requestBody =
        await request.json();
    } catch (error) {
      return jsonResponse(
        {
          ok: false,
          __apiError: true,
          message:
            'Request JSON tidak valid.'
        },
        400
      );
    }

    const action =
      String(
        requestBody &&
        requestBody.action
          ? requestBody.action
          : ''
      ).trim();

    if (
      !ALLOWED_ACTIONS.has(
        action
      )
    ) {
      return jsonResponse(
        {
          ok: false,
          __apiError: true,
          message:
            'Action tidak diizinkan.'
        },
        400
      );
    }

    const payload =
      requestBody &&
      requestBody.payload !==
        undefined
        ? requestBody.payload
        : {};

    /*
     * Batasi ukuran request sederhana.
     * Aplikasi ini hanya mengirim form kecil/credential,
     * tidak pernah mengirim file.
     */
    const clientIp =
      getClientIp(
        request
      );

    const upstreamBody =
      JSON.stringify({
        action,
        payload,

        meta: {
          clientIp:
            clientIp
        },

        secret:
          appsScriptSecret
      });

    if (
      upstreamBody.length >
      100000
    ) {
      return jsonResponse(
        {
          ok: false,
          __apiError: true,
          message:
            'Request terlalu besar.'
        },
        413
      );
    }

    try {
      const upstream =
        await fetch(
          appsScriptUrl,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'Accept':
                'application/json'
            },

            /*
             * ContentService Apps Script melakukan redirect
             * ke googleusercontent.com.
             */
            redirect:
              'follow',

            cache:
              'no-store',

            body:
              upstreamBody
          }
        );

      const rawText =
        await upstream.text();

      let data;

      try {
        data =
          JSON.parse(
            rawText
          );
      } catch (error) {
        console.error(
          'Respons Apps Script bukan JSON:',
          rawText.slice(
            0,
            500
          )
        );

        return jsonResponse(
          {
            ok: false,
            __apiError: true,
            message:
              'Backend Google Apps Script mengembalikan respons yang tidak valid. Periksa deployment dan akses Web App.'
          },
          502
        );
      }

      if (
        data &&
        data.__apiError ===
          true
      ) {
        return jsonResponse(
          data,
          400
        );
      }

      return jsonResponse(
        data,
        200
      );
    } catch (error) {
      console.error(
        'Gagal menghubungi Apps Script:',
        error
      );

      return jsonResponse(
        {
          ok: false,
          __apiError: true,
          message:
            'Vercel gagal menghubungi Google Apps Script.'
        },
        502
      );
    }
  }
};
