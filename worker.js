
const PRODUCTS = {
  "Plain Sourdough": 1000,
  "Jalapeño Cheddar": 1300,
  "Blueberry Lemon": 1300,
  "Pumpkin Spice": 1300,
  "Banana": 1300,
  "Homemade Pasta": 700,
  "Dubai Pistachio Granola": 600,
  "Italian Style Organic Sourdough Croutons": 600,
  "Banana Walnut Muffin": 400,
  "Cherry Nut Bread Muffins": 400,
  "Chocolate Cake": 500,
  "Fudgy Brownies": 500,
  "Cinnamon Rolls": 600,
  "Chocolate Chunk Sourdough Cookies": 200
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Verify a Stripe Checkout Session before confirming an order.
if (url.pathname === "/api/verify-checkout-session") {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed." }, 405);
  }

  const sessionId = url.searchParams.get("session_id");

  if (
    !sessionId ||
    !/^cs_(test|live)_[A-Za-z0-9_]+$/.test(sessionId)
  ) {
    return json({ error: "Invalid checkout session." }, 400);
  }

  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: "Payment service is not configured." }, 500);
  }

  try {
    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`
        }
      }
    );

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error(
        "Stripe verification failed:",
        session.error?.type
      );

      return json({
        error: "Unable to verify payment."
      }, 502);
    }

    return json({
      paid: session.payment_status === "paid"
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);

    return json({
      error: "Unable to verify payment."
    }, 502);
  }
}

    if (url.pathname === "/api/create-checkout-session") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed." }, 405);
      }

      if (!env.STRIPE_SECRET_KEY) {
        return json({ error: "Payment service is not configured." }, 500);
      }

      try {
        const order = await request.json();
        const { cart, name, email, phone, notes } = order;

        if (
          !Array.isArray(cart) ||
          cart.length === 0 ||
          cart.length > 30
        ) {
          return json({ error: "Your cart is empty or invalid." }, 400);
        }

        if (
          typeof name !== "string" || !name.trim() ||
          typeof email !== "string" ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
          typeof phone !== "string" || !phone.trim()
        ) {
          return json({
            error: "Please provide your name, valid email, and phone number."
          }, 400);
        }

        const params = new URLSearchParams();
params.set("ui_mode", "embedded_page");
        params.set("mode", "payment");
params.set(
  "return_url",
  `${url.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`
);
        params.set("customer_email", email.trim());
        params.set("phone_number_collection[enabled]", "true");
        params.set("metadata[customer_name]", name.trim().slice(0, 200));
        params.set("metadata[customer_phone]", phone.trim().slice(0, 100));
        params.set("metadata[order_notes]",
          typeof notes === "string" ? notes.trim().slice(0, 500) : ""
        );

        for (const [index, item] of cart.entries()) {
          const productName = item?.name;
          const price = PRODUCTS[productName];
          const quantity = Number(item?.quantity);

          if (
            !price ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 50
          ) {
            return json({ error: "A cart item is invalid." }, 400);
          }

          params.set(
            `line_items[${index}][price_data][currency]`, "usd"
          );
          params.set(
            `line_items[${index}][price_data][unit_amount]`,
            String(price)
          );
          params.set(
            `line_items[${index}][price_data][product_data][name]`,
            productName
          );
          params.set(
            `line_items[${index}][quantity]`, String(quantity)
          );
        }

        const stripeResponse = await fetch(
          "https://api.stripe.com/v1/checkout/sessions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
          }
        );

        const session = await stripeResponse.json();

        if (!stripeResponse.ok) {
console.error("Stripe session creation failed:", JSON.stringify(session.error));          return json({
            error: "Stripe could not start checkout. Please try again."
          }, 502);
        }

        return json({ clientSecret: session.client_secret });
      } catch (error) {
        console.error("Checkout request failed:", error.message);
        return json({ error: "Unable to start checkout." }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

