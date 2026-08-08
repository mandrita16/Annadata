import { transporter } from "@/lib/mailer";

export const sendInsuranceSubmissionEmail = async (claim: any, user: any) => {
  try {
    const mailOptions = {
      from: `"Tatva Insurance" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Insurance Claim Submitted - #${claim.claimId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f97316; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Claim Submitted Successfully</h1>
            <p style="margin: 10px 0 0; font-size: 14px;">Your PMFBY insurance claim is under review.</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your insurance claim for <strong>${claim.plotSnapshot?.name || "your plot"}</strong> has been submitted successfully.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 5px 0;"><strong>Claim ID:</strong> <span style="color: #f97316; font-size: 18px; font-weight: bold;">${claim.claimId}</span></p>
              <p style="margin: 5px 0;"><strong>Calamity Type:</strong> <span style="text-transform: capitalize;">${claim.calamityType}</span></p>
              <p style="margin: 5px 0;"><strong>Damaged Area:</strong> ${claim.damagedPercentage}%</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="text-transform: capitalize;">${claim.status}</span></p>
            </div>
            
            <p>We will notify you of any updates regarding your claim status.</p>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Tatva. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Successfully sent insurance submission email to: ${user.email}`);
  } catch (error) {
    console.error("Error sending insurance submission email:", error);
  }
};

export const sendInsuranceStatusUpdateEmail = async (claim: any, user: any) => {
  try {
    const statusColor = claim.status === 'approved' ? '#10b981' : claim.status === 'rejected' ? '#ef4444' : claim.status === 'cancelled' ? '#64748b' : '#f59e0b';
    
    const mailOptions = {
      from: `"Tatva Insurance" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Insurance Claim Update - #${claim.claimId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${statusColor}; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Claim Status Updated</h1>
            <p style="margin: 10px 0 0; font-size: 14px;">There is an update on your recent claim.</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your insurance claim for <strong>${claim.plotSnapshot?.name || "your plot"}</strong> has been updated to <strong>${claim.status}</strong>.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 5px 0;"><strong>Claim ID:</strong> <span style="font-weight: bold;">${claim.claimId}</span></p>
              <p style="margin: 5px 0;"><strong>Current Status:</strong> <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${claim.status}</span></p>
            </div>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Tatva. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending insurance status update email:", error);
  }
};
