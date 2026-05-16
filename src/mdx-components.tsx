import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    a: ({ children, href, ...props }) => (
      <a target="_blank" rel="noreferrer" href={href} {...props}>
        {children}
      </a>
    ),
    ...components,
  };
}
