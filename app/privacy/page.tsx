import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Privacy Policy - Coffee Engine",
  description: "Privacy policy for Coffee Engine - Learn how we handle your data and transaction information",
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4 border-b pb-6">
          <Link
            href="/"
            className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 2025</p>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle>1. Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              Coffee Engine is designed to assist users in installing and working with a React repository developed by
              us. The system operates without collecting, storing, or transferring personal user data.
            </p>
            <p className="text-muted-foreground">
              Transparency and minimal data usage are core principles of this system.
            </p>
          </CardContent>
        </Card>

        {/* Data We Do Not Collect */}
        <Card>
          <CardHeader>
            <CardTitle>2. Data We Do Not Collect</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {[
                "Personal information (such as name, email address, IP address, or location)",
                "User tracking across conversations",
                "Cookies, analytics tools, or tracking technologies",
                "Conversation history outside of the current session",
                "User data sent to third-party services",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary font-semibold mt-0.5">✓</span>
                  <span>
                    Does <strong>not</strong> collect {item}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Transaction Verification */}
        <Card>
          <CardHeader>
            <CardTitle>3. Transaction Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              The only data that may be temporarily processed is a <strong>transaction ID</strong> provided voluntarily
              by the user for coffee support verification.
            </p>
            <ul className="space-y-2 ml-4">
              {[
                "The transaction ID is used solely to verify payment status via a predefined verification action",
                "The transaction ID is not stored, logged, or reused",
                "No additional user information is requested or inferred during this process",
                "The verification process does not associate the transaction ID with any personal identity",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Knowledge Base Usage */}
        <Card>
          <CardHeader>
            <CardTitle>4. Knowledge Base Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              Coffee Engine includes a knowledge base consisting of a React repository and related technical
              documentation.
            </p>
            <ul className="space-y-2 ml-4">
              {[
                "The knowledge base is used only to provide installation guidance and technical assistance",
                "User inputs are not added to, trained on, or persisted within the knowledge base",
                "No user-provided data is exported, synchronized, or shared externally",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle>5. Data Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p className="font-semibold text-primary">
              Coffee Engine does not sell, rent, share, or disclose user data to any third parties.
            </p>
            <p>
              No user information is transferred to external systems, databases, or services under any circumstances.
            </p>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card>
          <CardHeader>
            <CardTitle>6. Data Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>Because no personal data is collected or stored, the risk of data exposure is inherently minimized.</p>
            <p className="text-muted-foreground">
              All processing occurs within the boundaries of the Coffee Engine environment and is limited to the
              duration of the active conversation.
            </p>
          </CardContent>
        </Card>

        {/* User Consent */}
        <Card>
          <CardHeader>
            <CardTitle>7. User Consent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              By interacting with Coffee Engine and voluntarily providing a transaction ID for verification, the user
              acknowledges and agrees that:
            </p>
            <ul className="space-y-2 ml-4">
              {[
                "The transaction ID is processed only for verification purposes",
                "No personal data is collected or retained",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card>
          <CardHeader>
            <CardTitle>8. Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>This Privacy Policy may be updated to reflect changes in functionality or compliance requirements.</p>
            <p className="text-muted-foreground">
              Any updates will be reflected in this document with a revised "Last updated" date.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>9. Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              If you have questions or concerns about this Privacy Policy, please refer to the repository or project
              documentation associated with Coffee Engine.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex justify-center pt-6 border-t">
          <Button asChild variant="outline">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
