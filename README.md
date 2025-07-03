# 💰 Bill Splitter

A smart restaurant bill splitting application built with Next.js, TypeScript, and AI-powered OCR technology.

## 🚀 Features

- **AI-Powered OCR**: Automatically extract items and prices from receipt photos
- **Smart Bill Splitting**: Percentage-based item assignment for fair splitting
- **Real-time Calculations**: Instant updates for tax, service charges, and tips
- **Mobile-First Design**: Optimized for use on phones at restaurants
- **Multi-language Support**: Ready for international receipts

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **OCR**: Tesseract.js for receipt text extraction
- **Deployment**: Vercel

## 📱 Live Demo

[Your Vercel URL will be here after deployment]

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Local Development

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd bill-splitter
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run the development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📸 How to Use

1. **Upload Receipt**: Take a photo or upload an image of your restaurant receipt
2. **Add People**: Enter the names of people splitting the bill
3. **Assign Items**: Use sliders to assign percentages of each item to people
4. **Configure Fees**: Set tax, service charge, and tip percentages
5. **Get Results**: View individual totals with detailed breakdown
6. **Share Summary**: Copy formatted summary to clipboard

## 🏗️ Project Structure

```
├── app/
│   ├── page.tsx          # Main application component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── ocr-upload.tsx    # OCR upload component
│   └── ui/               # Reusable UI components
├── hooks/
│   └── use-ocr.ts        # Custom OCR hook
├── lib/
│   └── ocr.ts            # OCR utilities and functions
├── types/
│   └── receipt.ts        # TypeScript type definitions
└── public/               # Static assets
```

## 🌐 Deployment

This project is optimized for deployment on Vercel. The deployment process is automated and handles:

- **Tesseract.js optimization** for browser compatibility
- **WebAssembly support** for OCR functionality
- **Image processing** for receipt analysis
- **Mobile responsiveness** across all devices

### Deploy to Vercel

1. **Push to GitHub**: Ensure your code is in a GitHub repository
2. **Connect to Vercel**: 
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your repository
3. **Deploy**: Vercel will automatically detect Next.js and deploy
4. **Test**: Your app will be live at `https://your-project.vercel.app`

## 🔧 Configuration

### Environment Variables

No environment variables are required for basic functionality. The app works entirely client-side.

### OCR Configuration

The OCR system is configured in `lib/ocr.ts` and includes:

- **Image preprocessing** for better accuracy
- **Multiple regex patterns** for different receipt formats
- **Confidence scoring** and validation
- **Error handling** with user feedback

## 🧪 Testing

### Manual Testing

1. **Receipt Upload**: Test with various receipt formats and image qualities
2. **OCR Accuracy**: Verify item and price extraction
3. **Bill Splitting**: Test different assignment scenarios
4. **Mobile Experience**: Test on various devices and screen sizes

### Sample Receipts

The app includes sample data for testing without uploading actual receipts.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tesseract.js** for OCR functionality
- **Radix UI** for accessible components
- **Tailwind CSS** for styling
- **Next.js** for the framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include screenshots for UI-related problems

---

Made with ❤️ for easier bill splitting! 