import {
    OrganizationsClient,
    EnablePolicyTypeCommand,
    ListRootsCommand
  } from "@aws-sdk/client-organizations";
  import {
    CloudFormationCustomResourceEvent,
    CloudFormationCustomResourceResponse
  } from "aws-lambda";
  import * as https from "https";
  import * as url from "url";
  
  export const handler = async (event: CloudFormationCustomResourceEvent): Promise<void> => {
    console.log("Received event:", JSON.stringify(event, null, 2));
    const client = new OrganizationsClient({});
  
    try {
      if (event.RequestType === 'Create' || event.RequestType === 'Update') {
        const rootsResponse = await client.send(new ListRootsCommand({}));
        const rootId = rootsResponse.Roots?.[0]?.Id;
  
        if (!rootId) {
          throw new Error("Unable to retrieve root ID");
        }
  
        try {
          await client.send(new EnablePolicyTypeCommand({
            RootId: rootId,
            PolicyType: "SERVICE_CONTROL_POLICY"
          }));
          console.log("SERVICE_CONTROL_POLICY successfully enabled.");
        } catch (enableError: any) {
          const message = enableError?.message || '';
          if (message.includes("already enabled")) {
            console.log("SERVICE_CONTROL_POLICY already enabled. Skipping...");
          } else {
            throw enableError; // Unhandled errors will still cause failure
          }
        }
      }
  
      await sendResponse(event, "SUCCESS", {
        Message: `${event.RequestType} event handled successfully`
      }, "EnableSCPPolicy");
    } catch (error: any) {
      console.error("Error:", error);
      await sendResponse(event, "FAILED", {
        Message: error.message || "Unknown error"
      }, "EnableSCPPolicy");
    }
  };
  
  // Sends response to CloudFormation
  const sendResponse = (
    event: CloudFormationCustomResourceEvent,
    responseStatus: "SUCCESS" | "FAILED",
    responseData: { [key: string]: any },
    physicalResourceId: string
  ): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const responseBody: CloudFormationCustomResourceResponse = {
        Status: responseStatus,
        Reason: responseData.Message || 'See CloudWatch Logs for details',
        PhysicalResourceId: physicalResourceId,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
      };
  
      const parsedUrl = url.parse(event.ResponseURL);
      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'PUT',
        headers: {
          'Content-Type': '',
          'Content-Length': Buffer.byteLength(JSON.stringify(responseBody))
        }
      };
  
      const request = https.request(options, (response) => {
        console.log(`CloudFormation response status: ${response.statusCode}`);
        resolve();
      });
  
      request.on('error', (error) => {
        console.error("sendResponse error:", error);
        reject(error);
      });
  
      request.write(JSON.stringify(responseBody));
      request.end();
    });
  };
  