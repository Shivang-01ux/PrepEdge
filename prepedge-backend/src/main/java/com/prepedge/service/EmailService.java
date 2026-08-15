package com.prepedge.service;

import com.prepedge.entity.Role;
import com.prepedge.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${spring.mail.username:noreply.prepedge@gmail.com}")
    private String fromEmail;

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    @Async
    public void sendWelcomeEmail(User user) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            log.warn("BREVO_API_KEY not set — skipping welcome email for {}", user.getEmail());
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            Map<String, Object> body = Map.of(
                "sender",     Map.of("name", "PrepEdge", "email", fromEmail),
                "to",         List.of(Map.of("email", user.getEmail(), "name", user.getUsername())),
                "subject",    buildSubject(user),
                "htmlContent", buildHtmlBody(user)
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_URL, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Welcome email sent to {} via Brevo API", user.getEmail());
            } else {
                log.warn("Brevo API returned {} for {}", response.getStatusCode(), user.getEmail());
            }
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}: {}", user.getEmail(), e.getMessage());
        }
    }

    private String buildSubject(User user) {
        if (user.getRole() == Role.ROLE_FACULTY) {
            return "Welcome to PrepEdge Faculty Portal, " + user.getUsername();
        }
        if (user.getRole() == Role.ROLE_ADMIN) {
            return "PrepEdge Admin Account Ready, " + user.getUsername();
        }
        return "Welcome to PrepEdge, " + user.getUsername() + " - Your placement journey starts now";
    }

    private String buildHtmlBody(User user) {
        return buildStudentEmail(user);
    }

    // ── Student HTML Email ────────────────────────────────────────────────────
    private String buildStudentEmail(User user) {
        String template = """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin:0;padding:0;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding:40px 20px">
                        <table width="600" cellpadding="0" cellspacing="0"
                               style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

                          <!-- HEADER -->
                          <tr>
                            <td style="background:linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%);padding:40px;text-align:center">
                              <div style="display:inline-block;background:#059669;width:60px;height:60px;border-radius:16px;line-height:60px;font-size:28px;margin-bottom:16px;box-shadow:0 0 24px rgba(5,150,105,0.4)">
                                &#9889;
                              </div>
                              <h1 style="color:white;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px">PrepEdge</h1>
                              <p style="color:#6ee7b7;margin:4px 0 0;font-size:13px;letter-spacing:0.1em">INDIA'S PLACEMENT PREP PLATFORM</p>
                            </td>
                          </tr>

                          <!-- HERO -->
                          <tr>
                            <td style="padding:40px 40px 24px;text-align:center">
                              <h2 style="color:#064e3b;font-size:24px;font-weight:700;margin:0 0 12px">
                                You're in, {username}!
                              </h2>
                              <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0">
                                Your PrepEdge account is ready. Join thousands of students cracking placements at top companies.
                              </p>
                            </td>
                          </tr>

                          <!-- ACCOUNT DETAILS -->
                          <tr>
                            <td style="padding:0 40px 32px">
                              <div style="background:#f0fdf4;border-radius:12px;padding:20px;border-left:4px solid #059669">
                                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600">YOUR ACCOUNT</p>
                                <p style="margin:4px 0;color:#064e3b;font-size:14px">Name: <strong>{username}</strong></p>
                                <p style="margin:4px 0;color:#064e3b;font-size:14px">College: <strong>{college}</strong></p>
                                <p style="margin:4px 0;color:#064e3b;font-size:14px">Email: <strong>{email}</strong></p>
                              </div>
                            </td>
                          </tr>

                          <!-- FEATURE BOXES -->
                          <tr>
                            <td style="padding:0 40px 32px">
                              <p style="color:#064e3b;font-size:14px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.05em">START WITH THESE</p>
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td width="48%" style="background:#f0fdf4;border-radius:12px;padding:16px;vertical-align:top;border:1px solid #d1fae5">
                                    <p style="margin:0 0 4px;color:#064e3b;font-size:14px;font-weight:600">MCQ Practice</p>
                                    <p style="margin:0;color:#6b7280;font-size:12px">500+ questions across 9 subjects</p>
                                  </td>
                                  <td width="4%"></td>
                                  <td width="48%" style="background:#f0fdf4;border-radius:12px;padding:16px;vertical-align:top;border:1px solid #d1fae5">
                                    <p style="margin:0 0 4px;color:#064e3b;font-size:14px;font-weight:600">Mock Tests</p>
                                    <p style="margin:0;color:#6b7280;font-size:12px">TCS, Infosys, Amazon, Wipro and more</p>
                                  </td>
                                </tr>
                                <tr><td colspan="3" style="height:12px"></td></tr>
                                <tr>
                                  <td width="48%" style="background:#f0fdf4;border-radius:12px;padding:16px;vertical-align:top;border:1px solid #d1fae5">
                                    <p style="margin:0 0 4px;color:#064e3b;font-size:14px;font-weight:600">Dashboard</p>
                                    <p style="margin:0;color:#6b7280;font-size:12px">Track accuracy and weak topics</p>
                                  </td>
                                  <td width="4%"></td>
                                  <td width="48%" style="background:#f0fdf4;border-radius:12px;padding:16px;vertical-align:top;border:1px solid #d1fae5">
                                    <p style="margin:0 0 4px;color:#064e3b;font-size:14px;font-weight:600">Leaderboard</p>
                                    <p style="margin:0;color:#6b7280;font-size:12px">Compete with college peers</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <!-- CTA -->
                          <tr>
                            <td style="padding:0 40px 40px;text-align:center">
                              <a href="https://prep-edge-snowy.vercel.app"
                                 style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:white;text-decoration:none;padding:16px 48px;border-radius:50px;font-size:16px;font-weight:700;letter-spacing:0.02em">
                                Start Practicing Now
                              </a>
                              <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">Best of luck for your placements!</p>
                            </td>
                          </tr>

                          <!-- FOOTER -->
                          <tr>
                            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center">
                              <p style="margin:0 0 4px;color:#064e3b;font-size:13px;font-weight:600">PrepEdge</p>
                              <p style="margin:0;color:#9ca3af;font-size:12px">India's Placement Preparation Platform</p>
                              <p style="margin:8px 0 0;color:#d1d5db;font-size:11px">This is an automated email. Please do not reply.</p>
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """;

        return template
                .replace("{username}", user.getUsername())
                .replace("{college}", user.getCollege() != null ? user.getCollege() : "—")
                .replace("{email}", user.getEmail());
    }

    // ── Recruiter HTML Email ──────────────────────────────────────────────────
    private String buildRecruiterEmail(User user) {
        String template = """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin:0;padding:0;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding:40px 20px">
                        <table width="600" cellpadding="0" cellspacing="0"
                               style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

                          <!-- HEADER -->
                          <tr>
                            <td style="background:linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%);padding:40px;text-align:center">
                              <div style="display:inline-block;background:#059669;width:60px;height:60px;border-radius:16px;line-height:60px;font-size:28px;margin-bottom:16px;box-shadow:0 0 24px rgba(5,150,105,0.4)">
                                &#9889;
                              </div>
                              <h1 style="color:white;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px">PrepEdge</h1>
                              <p style="color:#6ee7b7;margin:4px 0 0;font-size:13px;letter-spacing:0.1em">RECRUITER PORTAL</p>
                            </td>
                          </tr>

                          <!-- HERO -->
                          <tr>
                            <td style="padding:40px 40px 24px;text-align:center">
                              <h2 style="color:#064e3b;font-size:24px;font-weight:700;margin:0 0 12px">
                                Your Recruiter Portal is Ready, {username}
                              </h2>
                              <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0">
                                Access India's top placement-ready engineering talent
                              </p>
                            </td>
                          </tr>

                          <!-- ACCOUNT DETAILS -->
                          <tr>
                            <td style="padding:0 40px 32px">
                              <div style="background:#f0fdf4;border-radius:12px;padding:20px;border-left:4px solid #059669">
                                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600">YOUR ACCOUNT</p>
                                <p style="margin:4px 0;color:#064e3b;font-size:14px">Name: <strong>{username}</strong></p>
                                <p style="margin:4px 0;color:#064e3b;font-size:14px">Company: <strong>{company}</strong></p>
                                <p style="margin:4px 0;color:#064e3b;font-size:14px">Email: <strong>{email}</strong></p>
                              </div>
                            </td>
                          </tr>

                          <!-- FEATURE BOXES -->
                          <tr>
                            <td style="padding:0 40px 32px">
                              <p style="color:#064e3b;font-size:14px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.05em">WHAT YOU CAN DO</p>
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td width="48%" style="background:#f0fdf4;border-radius:12px;padding:16px;vertical-align:top;border:1px solid #d1fae5">
                                    <p style="margin:0 0 4px;color:#064e3b;font-size:14px;font-weight:600">Top Students</p>
                                    <p style="margin:0;color:#6b7280;font-size:12px">View ranked candidates</p>
                                  </td>
                                  <td width="4%"></td>
                                  <td width="48%" style="background:#f0fdf4;border-radius:12px;padding:16px;vertical-align:top;border:1px solid #d1fae5">
                                    <p style="margin:0 0 4px;color:#064e3b;font-size:14px;font-weight:600">College Filter</p>
                                    <p style="margin:0;color:#6b7280;font-size:12px">Filter by any college</p>
                                  </td>
                                </tr>
                                <tr><td colspan="3" style="height:12px"></td></tr>
                                <tr>
                                  <td width="48%" style="background:#f0fdf4;border-radius:12px;padding:16px;vertical-align:top;border:1px solid #d1fae5">
                                    <p style="margin:0 0 4px;color:#064e3b;font-size:14px;font-weight:600">Performance</p>
                                    <p style="margin:0;color:#6b7280;font-size:12px">See accuracy and scores</p>
                                  </td>
                                  <td width="4%"></td>
                                  <td width="48%" style="background:#f0fdf4;border-radius:12px;padding:16px;vertical-align:top;border:1px solid #d1fae5">
                                    <p style="margin:0 0 4px;color:#064e3b;font-size:14px;font-weight:600">Leaderboard</p>
                                    <p style="margin:0;color:#6b7280;font-size:12px">Find your next hire</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <!-- CTA -->
                          <tr>
                            <td style="padding:0 40px 40px;text-align:center">
                              <a href="https://prep-edge-snowy.vercel.app"
                                 style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:white;text-decoration:none;padding:16px 48px;border-radius:50px;font-size:16px;font-weight:700;letter-spacing:0.02em">
                                Access Recruiter Portal
                              </a>
                            </td>
                          </tr>

                          <!-- FOOTER -->
                          <tr>
                            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center">
                              <p style="margin:0 0 4px;color:#064e3b;font-size:13px;font-weight:600">PrepEdge</p>
                              <p style="margin:0;color:#9ca3af;font-size:12px">India's Placement Preparation Platform</p>
                              <p style="margin:8px 0 0;color:#d1d5db;font-size:11px">This is an automated email. Please do not reply.</p>
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """;

        return template
                .replace("{username}", user.getUsername())
                .replace("{company}", user.getCollege() != null ? user.getCollege() : "—")
                .replace("{email}", user.getEmail());
    }
}
