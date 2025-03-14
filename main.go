package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"time"
)

// writeTestFile creates a test file with the given content
func writeTestFile(filename, content string) error {
	return ioutil.WriteFile(filename, []byte(content), 0644)
}

// readTestFile reads the content of a test file
func readTestFile(filename string) (string, error) {
	data, err := ioutil.ReadFile(filename)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func main() {
	os.Stdout.WriteString("Hello world from tinygo\n")

	// Test environment variables
	os.Setenv("WASI_TEST_VAR", "test_value")
	envValue := os.Getenv("WASI_TEST_VAR")
	os.Stdout.WriteString(fmt.Sprintf("Environment variable: %s\n", envValue))

	// Test file operations
	testDir := "test_dir"
	os.MkdirAll(testDir, 0755)

	testFile := filepath.Join(testDir, "test.txt")
	writeContent := fmt.Sprintf("Test content created at %s", time.Now().String())

	if err := writeTestFile(testFile, writeContent); err != nil {
		os.Stdout.WriteString(fmt.Sprintf("Error writing file: %v\n", err))
	}

	if content, err := readTestFile(testFile); err != nil {
		os.Stdout.WriteString(fmt.Sprintf("Error reading file: %v\n", err))
	} else {
		os.Stdout.WriteString(fmt.Sprintf("File content: %s\n", content))
	}

	// Test context with timeout
	ctx, ctxCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer ctxCancel()

	counter := 0
	for {
		counter++
		currentTime := time.Now().String()
		os.Stdout.WriteString(fmt.Sprintf("Iteration %d: %s\n", counter, currentTime))

		// Append to our test file to test continuous file operations
		appendContent := fmt.Sprintf("Iteration %d at %s\n", counter, currentTime)
		appendFile, _ := os.OpenFile(testFile, os.O_APPEND|os.O_WRONLY, 0644)
		if appendFile != nil {
			appendFile.WriteString(appendContent)
			appendFile.Close()
		}

		select {
		case <-ctx.Done():
			if ctx.Err() == context.Canceled {
				os.Stdout.WriteString("Context was canceled\n")
			} else {
				os.Stdout.WriteString("Context timed out\n")
			}

			// Clean up
			os.RemoveAll(testDir)
			return
		case <-time.After(time.Second):
			// Continue the loop
		}
	}
}
