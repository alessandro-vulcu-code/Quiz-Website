// Question data for Multiple Choice Study App
// This file contains all courses, decks, and questions

const STUDY_DATA = {
    "courses": {
        "Digital Communication": {
            "decks": [
                {
                    "name": "Appendix",
                    "questions": [
                        {
                            "question": "What is the Probability Density Function (PDF) of a real-valued Gaussian random variable \\( X \\sim \\mathcal{N}(\\mu, \\sigma^2) \\)?",
                            "answers": [
                                "\\( f_X(x) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} \\exp\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right) \\)",
                                "\\( f_X(x) = \\frac{1}{\\pi\\sigma^2} \\exp\\left(-\\frac{(x-\\mu)^2}{\\sigma^2}\\right) \\)",
                                "\\( f_X(x) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} \\exp\\left(-\\frac{|x-\\mu|^2}{\\sigma^2}\\right) \\)",
                                "\\( f_X(x) = \\frac{1}{\\sqrt{\\pi\\sigma^2}} \\exp\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the Probability Density Function (PDF) of a proper complex Gaussian random variable \\( Z \\sim \\mathcal{CN}(\\mu, \\sigma^2) \\)?",
                            "answers": [
                                "\\( f_Z(z) = \\frac{1}{\\pi\\sigma^2} \\exp\\left(-\\frac{|z-\\mu|^2}{\\sigma^2}\\right) \\)",
                                "\\( f_Z(z) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} \\exp\\left(-\\frac{(z-\\mu)^2}{2\\sigma^2}\\right) \\)",
                                "\\( f_Z(z) = \\frac{1}{\\pi\\sigma^2} \\exp\\left(-\\frac{|z-\\mu|^2}{2\\sigma^2}\\right) \\)",
                                "\\( f_Z(z) = \\frac{1}{2\\pi\\sigma^2} \\exp\\left(-\\frac{|z-\\mu|^2}{\\sigma^2}\\right) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "For a complex Gaussian random vector \\( x \\sim \\mathcal{CN}(\\mu, R) \\), what is the PDF defined as?",
                            "answers": [
                                "\\( f_x(x) = \\frac{1}{\\pi^n \\det(R)} \\exp\\left(-(x-\\mu)^* R^{-1} (x-\\mu)\\right) \\)",
                                "\\( f_x(x) = \\frac{1}{(2\\pi)^n \\det(R)^{1/2}} \\exp\\left(-\\frac{1}{2}(x-\\mu)^* R^{-1} (x-\\mu)\\right) \\)",
                                "\\( f_x(x) = \\frac{1}{\\pi^n \\det(R)} \\exp\\left(-(x-\\mu)^T R^{-1} (x-\\mu)\\right) \\)",
                                "\\( f_x(x) = \\frac{1}{\\det(R)} \\exp\\left(-(x-\\mu)^* R (x-\\mu)\\right) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "Which of the following conditions is NOT required for the Moore-Penrose pseudoinverse \\( A^\\dagger \\)?",
                            "answers": [
                                "\\( A^\\dagger A A^\\dagger = A \\)",
                                "\\( A A^\\dagger A = A \\)",
                                "\\( (A A^\\dagger)^* = A A^\\dagger \\)",
                                "\\( (A^\\dagger A)^* = A^\\dagger A \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "If a matrix \\( A \\) is a \"Tall matrix\" (\\( m > n \\)) with full column rank, what is the closed-form expression for its pseudoinverse \\( A^\\dagger \\)?",
                            "answers": [
                                "\\( A^\\dagger = (A^* A)^{-1} A^* \\)",
                                "\\( A^\\dagger = A^* (A A^*)^{-1} \\)",
                                "\\( A^\\dagger = A^{-1} \\)",
                                "\\( A^\\dagger = A^* (A^* A)^{-1} \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "If a matrix \\( A \\) is a \"Fat matrix\" (\\( m < n \\)) with full row rank, what is the closed-form expression for its pseudoinverse \\( A^\\dagger \\)?",
                            "answers": [
                                "\\( A^\\dagger = A^* (A A^*)^{-1} \\)",
                                "\\( A^\\dagger = (A^* A)^{-1} A^* \\)",
                                "\\( A^\\dagger = (A A^*)^{-1} A^* \\)",
                                "\\( A^\\dagger = A^{-1} \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "In the general rank-deficient case using SVD \\( A = U \\Sigma V^* \\), how is the pseudoinverse \\( A^\\dagger \\) calculated?",
                            "answers": [
                                "\\( A^\\dagger = V \\Sigma^\\dagger U^* \\)",
                                "\\( A^\\dagger = U \\Sigma^\\dagger V^* \\)",
                                "\\( A^\\dagger = V^* \\Sigma^\\dagger U \\)",
                                "\\( A^\\dagger = U^* \\Sigma^\\dagger V \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "According to the Matrix Inversion Lemma (Woodbury Identity), what is \\( (A + BCD)^{-1} \\)?",
                            "answers": [
                                "\\( A^{-1} - A^{-1}B(C^{-1} + DA^{-1}B)^{-1}DA^{-1} \\)",
                                "\\( A^{-1} + A^{-1}B(C^{-1} + DA^{-1}B)^{-1}DA^{-1} \\)",
                                "\\( A^{-1} - B(C^{-1} + DA^{-1}B)^{-1}D \\)",
                                "\\( A^{-1} - A^{-1}B(C + DA^{-1}B)^{-1}DA^{-1} \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What does the \\( \\text{vec}(\\cdot) \\) operator do to a matrix?",
                            "answers": [
                                "It stacks the columns of the matrix argument onto a vector.",
                                "It stacks the rows of the matrix argument onto a vector.",
                                "It calculates the sum of the diagonal elements.",
                                "It computes the determinant of the matrix."
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the definition of the Z-transform \\( x(z) \\)?",
                            "answers": [
                                "\\( x(z) = \\sum_{n=0}^{\\infty} x[n] z^{-n} \\)",
                                "\\( x(z) = \\sum_{n=-\\infty}^{\\infty} x[n] z^{n} \\)",
                                "\\( x(z) = \\int_{-\\infty}^{\\infty} x(t) e^{-sz} dt \\)",
                                "\\( x(z) = \\sum_{n=0}^{\\infty} x[n] z^{n} \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What characterizes a Toeplitz matrix?",
                            "answers": [
                                "It is constant along each of its diagonals (top-left to bottom-right).",
                                "It is constant along each of its anti-diagonals.",
                                "It is a symmetric matrix where \\( A_{ij} = A_{ji} \\).",
                                "It is a matrix where all eigenvalues are positive."
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What characterizes a Hankel matrix?",
                            "answers": [
                                "It is an upside-down Toeplitz matrix (constant along rightward-ascending diagonals).",
                                "It is constant along each of its main diagonals.",
                                "It is always a diagonal matrix.",
                                "It is a matrix where the trace is zero."
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "If \\( A \\in \\mathbb{R}^{n \\times n} \\) and \\( c \\) is a scalar, what is \\( \\det(cA) \\)?",
                            "answers": [
                                "\\( c^n \\det(A) \\)",
                                "\\( c \\det(A) \\)",
                                "\\( c^{-1} \\det(A) \\)",
                                "\\( n^c \\det(A) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the relationship between the determinant and the trace of the logarithm of a matrix?",
                            "answers": [
                                "\\( \\log \\det(A) = \\text{tr}(\\log(A)) \\)",
                                "\\( \\det(\\log(A)) = \\text{tr}(A) \\)",
                                "\\( \\log \\det(A) = \\log \\text{tr}(A) \\)",
                                "\\( \\det(e^A) = \\log \\text{tr}(A) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "Which of the following is a valid property of the Trace operator concerning cyclic permutations?",
                            "answers": [
                                "\\( \\text{tr}(ABC) = \\text{tr}(BCA) \\)",
                                "\\( \\text{tr}(ABC) = \\text{tr}(ACB) \\)",
                                "\\( \\text{tr}(ABC) = \\text{tr}(BAC) \\)",
                                "\\( \\text{tr}(ABC) = \\text{tr}(CBA) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the trace of a Kronecker product \\( \\text{tr}(A \\otimes B) \\)?",
                            "answers": [
                                "\\( \\text{tr}(A)\\text{tr}(B) \\)",
                                "\\( \\text{tr}(A) + \\text{tr}(B) \\)",
                                "\\( \\text{tr}(A) / \\text{tr}(B) \\)",
                                "\\( \\text{tr}(AB) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "A complex random scalar \\( z \\) is said to be \"proper complex\" if:",
                            "answers": [
                                "\\( \\mathbb{E}[x^2] = \\mathbb{E}[x]^2 \\)",
                                "\\( \\mathbb{E}[|x|^2] = \\mathbb{E}[x]^2 \\)",
                                "\\( \\mathbb{E}[x^2] = 0 \\)",
                                "\\( \\text{Var}(x) = 0 \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "If \\( x \\) is a complex random vector with PDF \\( f_x(\\cdot) \\) and \\( y = Ax \\) where \\( A \\) is nonsingular, what is the PDF of \\( y \\)?",
                            "answers": [
                                "\\( f_y(y) = \\frac{f_x(A^{-1}y)}{|\\det(A)|^2} \\)",
                                "\\( f_y(y) = f_x(A^{-1}y) |\\det(A)|^2 \\)",
                                "\\( f_y(y) = \\frac{f_x(A^{-1}y)}{\\det(A)} \\)",
                                "\\( f_y(y) = f_x(Ay) |\\det(A)| \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "When is a random process \\( x(t) \\) considered Wide-Sense Stationary (WSS)?",
                            "answers": [
                                "When its mean and autocorrelation are invariant to time shifts.",
                                "When its probability density function is invariant to time shifts.",
                                "When all its higher-order moments are invariant to time shifts.",
                                "When its power spectral density is constant."
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What condition is required for a random process \\( x(t) \\) to be Ergodic?",
                            "answers": [
                                "Its distribution can be deduced from a single, sufficiently long realization (time averages equal ensemble averages).",
                                "Its mean changes linearly with time.",
                                "Its variance is zero at all times.",
                                "Its autocorrelation function is zero for all non-zero lags."
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the gradient \\( \\nabla_X \\text{tr}(R_0 X^* R_1) \\)?",
                            "answers": [
                                "\\( R_1 R_0 \\)",
                                "\\( R_0 R_1 \\)",
                                "\\( R_1 X R_0 \\)",
                                "\\( R_0 X R_1 \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the gradient \\( \\nabla_X \\log_e \\det(X) \\)?",
                            "answers": [
                                "\\( X^{-1} \\)",
                                "\\( X \\)",
                                "\\( \\text{tr}(X) \\)",
                                "\\( \\det(X) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "How is the Gamma function \\( \\Gamma(n) \\) related to the factorial for positive integers?",
                            "answers": [
                                "\\( \\Gamma(n) = (n-1)! \\)",
                                "\\( \\Gamma(n) = n! \\)",
                                "\\( \\Gamma(n) = (n+1)! \\)",
                                "\\( \\Gamma(n) = n \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "Which function is defined by the integral \\( J_n(x) = \\frac{1}{2\\pi} \\int_{-\\pi}^{\\pi} e^{-j(n\\xi - x \\sin \\xi)} d\\xi \\)?",
                            "answers": [
                                "Bessel function of the first kind",
                                "Modified Bessel function of the first kind",
                                "Gamma function",
                                "Hankel function"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What does Jensen's inequality state for a convex function \\( f \\) and a random variable \\( x \\)?",
                            "answers": [
                                "\\( f(\\mathbb{E}[x]) \\le \\mathbb{E}[f(x)] \\)",
                                "\\( \\mathbb{E}[f(x)] \\le f(\\mathbb{E}[x]) \\)",
                                "\\( f(\\mathbb{E}[x]) = \\mathbb{E}[f(x)] \\)",
                                "\\( f(\\mathbb{E}[x]) \\ge \\mathbb{E}[f(x)] \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the formula for the Discrete Entropy \\( H(x) \\)?",
                            "answers": [
                                "\\( H(x) = -\\sum_{i} p(x_i) \\log_2(p(x_i)) \\)",
                                "\\( H(x) = \\sum_{i} p(x_i) \\log_2(p(x_i)) \\)",
                                "\\( H(x) = -\\sum_{i} \\log_2(p(x_i)) \\)",
                                "\\( H(x) = -\\prod_{i} p(x_i) \\log_2(p(x_i)) \\)"
                            ],
                            "correctIndex": 0
                        }
                    ],
                    "imported": true,
                    "importDate": "2026-01-06T14:16:20.349Z"
                },
                {
                    "name": "Chapter 1",
                    "questions": [
                        {
                            "question": "What characterizes a **Stationary** random process?",
                            "answers": [
                                "Its statistical distribution is invariant to time shifts.",
                                "Its time averages always equal its ensemble averages.",
                                "Its mean and autocorrelation vary sinusoidally with time.",
                                "It must be a Gaussian process."
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the condition for a random process to be **Ergodic**?",
                            "answers": [
                                "Its time averages equal its ensemble averages asymptotically.",
                                "It must be strictly stationary and Gaussian.",
                                "It implies that the process has zero mean and unit variance.",
                                "Its power spectral density is constant."
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "According to **Jensen's Inequality**, for a **convex** function \\( f(\\cdot) \\) and a random variable \\( x \\), which inequality holds?",
                            "answers": [
                                "\\( f(\\mathbb{E}[x]) \\le \\mathbb{E}[f(x)] \\)",
                                "\\( \\mathbb{E}[f(x)] \\le f(\\mathbb{E}[x]) \\)",
                                "\\( f(\\mathbb{E}[x]) = \\mathbb{E}[f(x)] \\)",
                                "\\( f(\\mathbb{E}[x]) \\ge \\mathbb{E}[f(x)]^2 \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the formula for **Discrete Entropy** \\( H(x) \\)?",
                            "answers": [
                                "\\( -\\mathbb{E}[\\log_{2}(p(x))] \\)",
                                "\\( -\\sum p(x) \\ln(p(x)) \\)",
                                "\\( \\mathbb{E}[p(x) \\log_{2}(p(x))] \\)",
                                "\\( \\sum p(x)^2 \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the **Joint Entropy** \\( H(x_0, x_1) \\) if \\( x_0 \\) and \\( x_1 \\) are **independent**?",
                            "answers": [
                                "\\( H(x_0) + H(x_1) \\)",
                                "\\( H(x_0) - H(x_1) \\)",
                                "\\( H(x_0) \\cdot H(x_1) \\)",
                                "\\( 0 \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "Which equation represents the entropy **Chain Rule** for two variables?",
                            "answers": [
                                "\\( H(x_0, x_1) = H(x_1) + H(x_0|x_1) \\)",
                                "\\( H(x_0, x_1) = H(x_1) - H(x_0|x_1) \\)",
                                "\\( H(x_0, x_1) = H(x_1) \\cdot H(x_0|x_1) \\)",
                                "\\( H(x_0, x_1) = H(x_0) + H(x_1) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the **Differential Entropy** of a **Complex Gaussian Scalar** \\( x \\sim \\mathcal{N}_{\\mathbb{C}}(\\mu_x, \\sigma_x^2) \\)?",
                            "answers": [
                                "\\( \\log_2(\\pi e \\sigma_x^2) \\)",
                                "\\( \\frac{1}{2} \\log_2(2 \\pi e \\sigma_x^2) \\)",
                                "\\( \\log_2(\\pi \\sigma_x^2) \\)",
                                "\\( \\ln(\\pi e \\sigma_x^2) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the **Differential Entropy** of a **Complex Gaussian Vector** \\( x \\sim \\mathcal{N}_{\\mathbb{C}}(\\mu, R) \\)?",
                            "answers": [
                                "\\( \\log_2(\\det(\\pi e R)) \\)",
                                "\\( \\log_2(\\det(\\pi R)) \\)",
                                "\\( \\det(\\log_2(\\pi e R)) \\)",
                                "\\( n \\log_2(\\det(R)) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "How is the **Entropy Rate** \\( \\mathcal{H} \\) defined for a stationary process?",
                            "answers": [
                                "\\( \\lim_{N\\rightarrow\\infty} \\frac{1}{N} H(x_0, ..., x_{N-1}) \\)",
                                "\\( \\lim_{N\\rightarrow\\infty} H(x_N) \\)",
                                "\\( \\lim_{N\\rightarrow\\infty} \\sum H(x_i) \\)",
                                "\\( \\frac{1}{N} \\sum_{i=0}^{N-1} H(x_i) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the formula for **Relative Entropy** (Kullback-Leibler Divergence) \\( D(p||q) \\)?",
                            "answers": [
                                "\\( \\mathbb{E}[\\log_2 \\frac{p(x)}{q(x)}] \\)",
                                "\\( \\mathbb{E}[\\log_2 \\frac{q(x)}{p(x)}] \\)",
                                "\\( -\\sum p(x) \\log_2 q(x) \\)",
                                "\\( \\sum p(x) (1 - \\frac{q(x)}{p(x)}) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "How is **Mutual Information** \\( \\mathcal{I}(s",
                            "answers": [
                                "y) \\) defined in terms of entropy?",
                                "\\( H(s) - H(s|y) \\)",
                                "\\( H(s) + H(s|y) \\)",
                                "\\( H(y|s) - H(y) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the **Gaussian Mutual Information** for a Complex Scalar with SNR \\( \\rho \\)?",
                            "answers": [
                                "\\( \\log_2(1 + \\rho) \\)",
                                "\\( \\log_2(\\rho) \\)",
                                "\\( \\frac{1}{2} \\log_2(1 + \\rho) \\)",
                                "\\( \\ln(1 + \\rho) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the approximation of Gaussian Mutual Information for **small** \\( \\rho \\)?",
                            "answers": [
                                "\\( \\rho \\log_2 e \\)",
                                "\\( \\log_2 \\rho \\)",
                                "\\( \\rho^2 \\log_2 e \\)",
                                "\\( 1 + \\rho \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the approximation of Gaussian Mutual Information for **large** \\( \\rho \\)?",
                            "answers": [
                                "\\( \\log_2 \\rho \\)",
                                "\\( \\rho \\log_2 e \\)",
                                "\\( \\log_2(1 - \\rho) \\)",
                                "\\( \\rho \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "For a **Complex Gaussian Vector**, what is the Mutual Information \\( \\mathcal{I}(\\rho) \\) at low \\( \\rho \\)?",
                            "answers": [
                                "\\( \\text{tr}(\\rho A R_s A^* R_z^{-1} + I) \\rho \\log_2 e \\)",
                                "\\( \\log_2(\\det(\\rho A R_s A^*)) \\)",
                                "\\( \\text{tr}(R_s) \\log_2 \\rho \\)",
                                "\\( \\min(N_s, N_y) \\log_2 \\rho \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "How is **Channel Capacity** \\( C \\) defined for a memoryless channel?",
                            "answers": [
                                "\\( \\max_{\\text{constraints}} \\mathcal{I}(s",
                                "y) \\)",
                                "\\( \\min_{\\text{constraints}} H(s|y) \\)",
                                "\\( \\max_{\\text{constraints}} H(s) \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "In **Maximum Likelihood (ML) Decoding** with Gaussian noise, maximizing the likelihood function is equivalent to?",
                            "answers": [
                                "Minimizing the Euclidean distance \\( ||y - \\sqrt{\\rho} A s_m||^2 \\)",
                                "Maximizing the Euclidean distance \\( ||y - \\sqrt{\\rho} A s_m||^2 \\)",
                                "Minimizing the noise variance",
                                "Maximizing the signal power"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the general expression for the **MMSE Estimator** \\( \\hat{s}(y) \\)?",
                            "answers": [
                                "\\( \\mathbb{E}[s|y] \\)",
                                "\\( \\text{argmax } p(y|s) \\)",
                                "\\( \\mathbb{E}[y|s] \\)",
                                "\\( \\mathbb{E}[s] \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What does the **Orthogonality Principle** state regarding the estimation error \\( s - \\hat{s}(y) \\)?",
                            "answers": [
                                "\\( \\mathbb{E}[g^*(y)(s-\\hat{s}(y))] = 0 \\) for any function \\( g \\)",
                                "\\( \\mathbb{E}[(s-\\hat{s}(y))^2] = 0 \\)",
                                "\\( \\mathbb{E}[s(s-\\hat{s}(y))^*] = 1 \\)",
                                "The error is orthogonal to the transmitted signal \\( s \\)."
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the **MMSE** value for a scalar signal in Gaussian noise with SNR \\( \\rho \\)?",
                            "answers": [
                                "\\( \\frac{1}{1+\\rho} \\)",
                                "\\( \\frac{\\rho}{1+\\rho} \\)",
                                "\\( 1+\\rho \\)",
                                "\\( \\frac{1}{\\rho} \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the **I-MMSE Relationship** for a scalar Gaussian channel?",
                            "answers": [
                                "\\( \\frac{1}{\\log_2 e} \\frac{\\partial}{\\partial \\rho} \\mathcal{I}(\\rho) = \\text{MMSE}(\\rho) \\)",
                                "\\( \\frac{\\partial}{\\partial \\rho} \\text{MMSE}(\\rho) = \\mathcal{I}(\\rho) \\)",
                                "\\( \\mathcal{I}(\\rho) \\cdot \\text{MMSE}(\\rho) = 1 \\)",
                                "\\( \\mathcal{I}(\\rho) = \\text{MMSE}(\\rho) \\log_2 e \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the formula for the **Linear MMSE (LMMSE)** estimator weight matrix \\( W^{MMSE} \\)?",
                            "answers": [
                                "\\( R_y^{-1} R_{ys} \\)",
                                "\\( R_{ys} R_y^{-1} \\)",
                                "\\( R_s R_y^{-1} \\)",
                                "\\( R_y R_{ys}^{-1} \\)"
                            ],
                            "correctIndex": 0
                        },
                        {
                            "question": "What is the **I-MMSE relationship for vectors** involving the gradient \\( \\nabla_A \\)?",
                            "answers": [
                                "\\( \\frac{1}{\\log_2 e} \\nabla_A I(s",
                                "\\sqrt{\\rho}As+z) = \\rho A E \\)",
                                "\\( \\nabla_A I(\\rho) = E \\)",
                                "\\( \\frac{1}{\\log_2 e} \\nabla_A E = \\rho I(\\rho) \\)"
                            ],
                            "correctIndex": 0
                        }
                    ],
                    "imported": true,
                    "importDate": "2026-01-06T14:16:53.258Z"
                }
            ]
        }
    }
};
