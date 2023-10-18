const puppeteer = require("puppeteer");
const azure = require("azure-storage");
const nodemailer = require("nodemailer");

async function main() {
    const LOGIN_URL = "https://sahrdaya.linways.com/student/";

    const STORAGEACCOUNTNAME = "bolbstoragedemo";
    const CONNECTIONSTRING = `DefaultEndpointsProtocol=https;AccountName=${STORAGEACCOUNTNAME};AccountKey=P/wu0DZvmLAN7/KIFK6buZhRbeBlXgY24tgSoHp1ywqH1gJyFAAtytVUyux4DG3VQ7WEpG7pdbfn+AStLhMSNg==;EndpointSuffix=core.windows.net`;
    const blobService = azure.createBlobService(CONNECTIONSTRING);

    const containerName = "domstate";

    const BETAUSERS = [
        {
            username: "221038",
            password: "221038",
        },
        {
            username: "221039",
            password: "221039",
        },
        {
            username: "221911",
            password: "ijk36awi?cla",
        },
        {
            username: "221005",
            password: "kichu@123"
        }
    ];

    const randomIndex = Math.floor(Math.random() * BETAUSERS.length);
    const randomUser = BETAUSERS[randomIndex];

    const USERNAME = randomUser.username;
    const PASSWORD = randomUser.password;
    context.log("Timer function processed request.");

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Navigate to the login page
        await page.goto(LOGIN_URL);

        // Fill in the login form
        const usernameInput = await page.$('input[name="studentAccount"]');
        const passwordInput = await page.$('input[name="studentPassword"]');

        if (usernameInput && passwordInput) {
            await usernameInput.type(USERNAME);
            await passwordInput.type(PASSWORD);

            const signInButton = await page.$("button.loginbutton");
            if (signInButton) {
                await signInButton.click();

                await page.waitForNavigation();
                const myPerformanceLink = await page.$(
                    'a[href="?menu=mymark&action=list"]'
                );
                if (myPerformanceLink) {
                    await myPerformanceLink.click();
                    await page.waitForNavigation();

                    const table = await page.waitForSelector(
                        "span table.table.table-striped.flexible-table.student-data-table"
                    );

                    if (table) {
                        const rows = await table.$$("tbody tr.f-tr");
                        const data = [];

                        for (const row of rows) {
                            const columns = await row.$$("td");
                            const rowData = {
                                subjectName:
                                    columns.length > 0
                                        ? await columns[0].evaluate((node) =>
                                            node.textContent.trim()
                                        )
                                        : "",
                                marksObtained:
                                    columns.length > 1
                                        ? await columns[1].evaluate((node) =>
                                            node.textContent.trim()
                                        )
                                        : "",
                                percentage:
                                    columns.length > 2
                                        ? await columns[2].evaluate((node) =>
                                            node.textContent.trim()
                                        )
                                        : "",
                                classAverage:
                                    columns.length > 3
                                        ? await columns[3].evaluate((node) =>
                                            node.textContent.trim()
                                        )
                                        : "",
                                maxMarks:
                                    columns.length > 4
                                        ? await columns[4].evaluate((node) =>
                                            node.textContent.trim()
                                        )
                                        : "",
                            };

                            data.push(rowData);
                        }

                        context.log(data);
                        const jsonData = JSON.stringify(data);

                        // Check if the blob exists for the student
                        const studentFolder = `student_${USERNAME}`;
                        const blobName = `student_${USERNAME}domstate.json`;
                        blobService.getBlobToText(
                            containerName,
                            `${studentFolder}/${blobName}`,
                            function (error, result, response) {
                                if (!error) {
                                    const existingData = JSON.parse(result);

                                    // Check if there is a change
                                    if (JSON.stringify(existingData) !== JSON.stringify(data)) {
                                        // Data has changed, log the new object
                                        const newObject = data.find(
                                            (item) =>
                                                !existingData.some(
                                                    (eItem) =>
                                                        JSON.stringify(item) === JSON.stringify(eItem)
                                                )
                                        );

                                        if (newObject) {
                                            context.log("New object detected:");
                                            context.log(newObject);
                                            // async function sentReq() {
                                            //   const endpointURL =
                                            //     "http://localhost:7071/api/LinMarkBOT";
                                            //   await axios.get(endpointURL);
                                            // }

                                            // context.log("GET request sent to the endpoint.");
                                        }

                                        // Update the blob
                                        blobService.createBlockBlobFromText(
                                            containerName,
                                            `${studentFolder}/${blobName}`,
                                            jsonData,
                                            function (error, result, response) {
                                                if (!error) {
                                                    context.log("Blob updated successfully.");
                                                } else {
                                                    context.log(
                                                        `Error updating blob: ${error.message}`
                                                    );
                                                }
                                            }
                                        );
                                    } else {
                                        context.log("No changes detected, blob not updated.");
                                    }
                                } else if (error && error.code === "BlobNotFound") {
                                    blobService.createBlockBlobFromText(
                                        containerName,
                                        `${studentFolder}/${blobName}`,
                                        jsonData,
                                        function (error, result, response) {
                                            if (!error) {
                                                context.log("Blob created successfully.");
                                            } else {
                                                context.log(`Error creating blob: ${error.message}`);
                                            }
                                        }
                                    );
                                } else {
                                    context.log(`Error checking blob: ${error.message}`);
                                }
                            }
                        );
                    } else {
                        context.log("Table not found.");
                    }
                } else {
                    context.log("My Performance link not found.");
                }
            } else {
                context.log("Sign-in button not found.");
            }
        } else {
            context.log("Username and/or password input element(s) not found.");
        }

        await browser.close();
    } catch (error) {
        context.log(`Error: ${error.message}`);
    }

}

main().catch((error) => {
    console.error("An error occurred:", error);
  });





// Select a random user from BETAUSER
