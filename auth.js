alert("1. AUTH.JS STARTED");

alert(
  "2. Supabase library type: " +
  typeof window.supabase
);

alert(
  "3. PETSHOP_CONFIG type: " +
  typeof window.PETSHOP_CONFIG
);

if (
  typeof window.supabase === "undefined"
) {

  alert(
    "ERROR: Supabase JavaScript library is NOT available."
  );

} else if (
  typeof window.PETSHOP_CONFIG === "undefined"
) {

  alert(
    "ERROR: PETSHOP_CONFIG is NOT available."
  );

} else {

  alert(
    "4. Supabase URL: " +
    window.PETSHOP_CONFIG.supabaseUrl
  );

  alert(
    "5. Supabase key exists: " +
    Boolean(
      window.PETSHOP_CONFIG.supabasePublishableKey
    )
  );

  try {

    const testClient =
      window.supabase.createClient(
        window.PETSHOP_CONFIG.supabaseUrl,
        window.PETSHOP_CONFIG.supabasePublishableKey
      );

    alert(
      "6. SUPABASE CLIENT CREATED"
    );

    window.TEST_SUPABASE_CLIENT =
      testClient;

  } catch (error) {

    alert(
      "ERROR CREATING SUPABASE CLIENT:\n" +
      error.message
    );

  }

}
